import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { WhatsAppInstance } from "@/types";

// Use healthcare-backend as proxy to avoid CORS issues with Evolution API
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-clinic-backend.fly.dev";

interface WhatsAppState {
  instances: WhatsAppInstance[];
  globalInstance: WhatsAppInstance | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchInstances: (
    organizationId: string,
    isSuperadmin: boolean,
  ) => Promise<void>;
  syncInstanceStatus: (instance: WhatsAppInstance) => Promise<void>;
  createInstance: (data: {
    instanceName: string;
    organizationId: string | null;
    isGlobal: boolean;
    userId: string;
  }) => Promise<WhatsAppInstance>;
  deleteInstance: (instanceId: string, instanceName: string) => Promise<void>;
  getQRCode: (instanceName: string) => Promise<string | null>;
  getInstanceStatus: (instanceName: string) => Promise<string>;
  disconnectInstance: (instanceName: string) => Promise<void>;
  clearError: () => void;
}

export const useWhatsAppStore = create<WhatsAppState>((set, get) => ({
  instances: [],
  globalInstance: null,
  isLoading: false,
  error: null,

  fetchInstances: async (organizationId: string, isSuperadmin: boolean) => {
    try {
      set({ isLoading: true, error: null });

      let query = supabase
        .schema("sales")
        .from("whatsapp_instances")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isSuperadmin) {
        query = query.or(
          `organization_id.eq.${organizationId},is_global.eq.true`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      const instances = data as WhatsAppInstance[];
      const globalInstance = instances.find((i) => i.is_global) || null;

      set({
        instances: instances.filter((i) => !i.is_global),
        globalInstance,
        isLoading: false,
      });

      // Sync real status from Evolution API for each instance
      const state = get();
      for (const instance of instances) {
        state.syncInstanceStatus(instance);
      }
    } catch (error) {
      console.error("Error fetching instances:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch instances",
      });
    }
  },

  syncInstanceStatus: async (instance: WhatsAppInstance) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/integrations/evolution/status/${instance.instance_name}`,
        { method: "GET" },
      );

      if (!response.ok) return;

      const data = await response.json();
      let newStatus: "connected" | "connecting" | "disconnected" =
        "disconnected";

      if (data.is_truly_connected) {
        newStatus = "connected";
      } else if (data.state === "qr" || data.state === "connecting") {
        newStatus = "connecting";
      }

      // Only update if status changed
      if (newStatus !== instance.status) {
        console.log(
          `[WhatsApp] Status changed for ${instance.instance_name}: ${instance.status} -> ${newStatus}`,
        );

        // Update database
        await supabase
          .schema("sales")
          .from("whatsapp_instances")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", instance.id);

        // Update local state
        set((state) => ({
          instances: state.instances.map((i) =>
            i.id === instance.id ? { ...i, status: newStatus } : i,
          ),
          globalInstance:
            state.globalInstance?.id === instance.id
              ? { ...state.globalInstance, status: newStatus }
              : state.globalInstance,
        }));
      }
    } catch (error) {
      console.error(
        `Error syncing status for ${instance.instance_name}:`,
        error,
      );
    }
  },

  createInstance: async ({
    instanceName,
    organizationId,
    isGlobal,
    userId,
  }) => {
    try {
      set({ isLoading: true, error: null });

      console.log("[WhatsApp] Creating instance via backend:", instanceName);

      // Create instance via backend proxy (handles Evolution API)
      const evolutionResponse = await fetch(
        `${BACKEND_URL}/integrations/evolution/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationId: organizationId || "sales-global",
            instanceName,
          }),
        },
      );

      if (!evolutionResponse.ok) {
        const errorData = await evolutionResponse.json();
        throw new Error(
          errorData.detail || "Failed to create Evolution instance",
        );
      }

      const evolutionData = await evolutionResponse.json();
      console.log("[WhatsApp] Backend response:", evolutionData);

      // Save to sales database
      const { data, error } = await supabase
        .schema("sales")
        .from("whatsapp_instances")
        .insert({
          instance_name: instanceName,
          organization_id: isGlobal ? null : organizationId,
          is_global: isGlobal,
          status: "disconnected",
          evolution_instance_id: evolutionData.instance_name || instanceName,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      set({ isLoading: false });

      // Refresh instances
      const state = get();
      await state.fetchInstances(organizationId || "", isGlobal);

      return data as WhatsAppInstance;
    } catch (error) {
      console.error("Error creating instance:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to create instance",
      });
      throw error;
    }
  },

  deleteInstance: async (instanceId: string, instanceName: string) => {
    try {
      set({ isLoading: true, error: null });

      console.log("[WhatsApp] Deleting instance via backend:", instanceName);

      // Delete from Evolution API via backend proxy
      try {
        const response = await fetch(
          `${BACKEND_URL}/integrations/evolution/${instanceName}`,
          {
            method: "DELETE",
          },
        );
        if (!response.ok) {
          console.warn("[WhatsApp] Evolution delete failed:", response.status);
        }
      } catch (e) {
        console.warn("[WhatsApp] Evolution delete failed:", e);
      }

      // Delete from sales database
      const { error } = await supabase
        .schema("sales")
        .from("whatsapp_instances")
        .delete()
        .eq("id", instanceId);

      if (error) throw error;

      set((state) => ({
        instances: state.instances.filter((i) => i.id !== instanceId),
        globalInstance:
          state.globalInstance?.id === instanceId ? null : state.globalInstance,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error deleting instance:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to delete instance",
      });
      throw error;
    }
  },

  getQRCode: async (instanceName: string) => {
    console.log("[WhatsApp] getQRCode called for:", instanceName);
    console.log("[WhatsApp] Using backend proxy at:", BACKEND_URL);
    try {
      // Use dedicated QR endpoint
      const url = `${BACKEND_URL}/integrations/evolution/qr/${instanceName}`;
      console.log("[WhatsApp] Fetching QR from:", url);
      const response = await fetch(url, {
        method: "GET",
      });

      console.log("[WhatsApp] Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[WhatsApp] Error response:", errorText);
        throw new Error("Failed to get QR code");
      }

      const data = await response.json();
      console.log("[WhatsApp] QR response:", data);

      if (data.success && data.qrcode) {
        console.log("[WhatsApp] QR code found!");
        return data.qrcode;
      } else {
        console.log("[WhatsApp] No QR code:", data.message || "unknown reason");
        return null;
      }
    } catch (error) {
      console.error("[WhatsApp] Error getting QR code:", error);
      return null;
    }
  },

  getInstanceStatus: async (instanceName: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/integrations/evolution/status/${instanceName}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        return "disconnected";
      }

      const data = await response.json();
      // Map backend status to our status format
      if (data.is_truly_connected) return "connected";
      if (data.state === "qr") return "connecting";
      return data.state || "disconnected";
    } catch (error) {
      console.error("Error getting status:", error);
      return "disconnected";
    }
  },

  disconnectInstance: async (instanceName: string) => {
    try {
      console.log(
        "[WhatsApp] Disconnecting instance via backend:",
        instanceName,
      );
      await fetch(
        `${BACKEND_URL}/integrations/evolution/disconnect/${instanceName}`,
        {
          method: "POST",
        },
      );

      // Update local state
      set((state) => ({
        instances: state.instances.map((i) =>
          i.instance_name === instanceName
            ? { ...i, status: "disconnected" as const }
            : i,
        ),
        globalInstance:
          state.globalInstance?.instance_name === instanceName
            ? { ...state.globalInstance, status: "disconnected" as const }
            : state.globalInstance,
      }));
    } catch (error) {
      console.error("Error disconnecting:", error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
