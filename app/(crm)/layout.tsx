import { AppShell } from "@/components/layout/app-shell";
import { defaultAppSettings } from "@/lib/default-settings";
import { createClient } from "@/supabase/server";

function unknownColumnName(message?: string) {
  if (!message) return null;

  return (
    message.match(/Could not find the '([^']+)' column/)?.[1] ??
    message.match(/column "([^"]+)" does not exist/)?.[1] ??
    message.match(/'([^']+)' column of 'app_settings'/)?.[1] ??
    null
  );
}

async function loadAppSettings() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const byOwnerUserId = await supabase.from("app_settings").select("*").eq("owner_user_id", user.id).maybeSingle();
  if (!byOwnerUserId.error) return byOwnerUserId.data;

  if (unknownColumnName(byOwnerUserId.error.message) === "owner_user_id") {
    const byOwnerId = await supabase.from("app_settings").select("*").eq("owner_id", user.id).maybeSingle();
    return byOwnerId.error ? null : byOwnerId.data;
  }

  return null;
}

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const settings = await loadAppSettings();

  return (
    <AppShell
      companyCard={{
        companyName: settings?.company_name ?? defaultAppSettings.companyName,
        companyAddress: settings?.company_address ?? defaultAppSettings.companyAddress,
        senderPhone: settings?.sender_phone ?? defaultAppSettings.senderPhone,
        senderEmail: settings?.sender_email ?? defaultAppSettings.senderEmail
      }}
    >
      {children}
    </AppShell>
  );
}
