$path = "app/dashboard/settings/page.tsx"

if (-not (Test-Path $path)) {
  throw "Could not find $path. Run this script from the admin-dashboard root."
}

$resolvedPath = Resolve-Path $path
$text = [System.IO.File]::ReadAllText($resolvedPath)
$text = $text.TrimStart([char]0xFEFF)

if ($text -notmatch 'ConfirmDialog') {
  $text = $text.Replace(
    'import { GlassCard } from "@/components/ui/GlassCard";',
    "import { AdminLoadingState } from `"@/components/ui/AdminLoadingState`";`nimport { ConfirmDialog } from `"@/components/ui/ConfirmDialog`";`nimport { GlassCard } from `"@/components/ui/GlassCard`";"
  )
}

if ($text -notmatch 'const \[deleteDialogOpen') {
  $text = $text.Replace(
    '  const [deletingAccount, setDeletingAccount] = useState(false);',
    "  const [deletingAccount, setDeletingAccount] = useState(false);`n  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);"
  )
}

$oldDeleteFunction = @'
  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setDeleteError("");

    if (!deletePassword.trim()) {
      setDeleteError("Current password is required.");
      return;
    }

    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      setDeleteError('Type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    setDeletingAccount(true);

    try {
      await api.delete<DeleteAccountResponse>("/profile", {
        data: {
          current_password: deletePassword,
          confirmation_text: deleteConfirmation,
        },
      });

      clearAdminToken();
      window.location.assign("/login");
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(requestError, "Unable to delete this account."),
      );
    } finally {
      setDeletingAccount(false);
    }
  }
'@

$newDeleteFunction = @'
  function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setDeleteError("");

    if (!deletePassword.trim()) {
      setDeleteError("Current password is required.");
      return;
    }

    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      setDeleteError('Type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    setDeleteDialogOpen(true);
  }

  async function performDeleteAccount() {
    setDeleteError("");
    setDeletingAccount(true);

    try {
      await api.delete<DeleteAccountResponse>("/profile", {
        data: {
          current_password: deletePassword,
          confirmation_text: deleteConfirmation,
        },
      });

      clearAdminToken();
      window.location.assign("/login");
    } catch (requestError) {
      setDeleteDialogOpen(false);
      setDeleteError(
        getApiErrorMessage(requestError, "Unable to delete this account."),
      );
    } finally {
      setDeletingAccount(false);
    }
  }
'@

$text = $text.Replace($oldDeleteFunction, $newDeleteFunction)

$oldLoadingProfile = @'
  if (loadingProfile) {
    return (
      <PageTransition className="space-y-6 pb-10">
        <GlassCard>
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 size={18} className="animate-spin text-teal-300" />
            Loading profile settings...
          </div>
        </GlassCard>
      </PageTransition>
    );
  }
'@

$newLoadingProfile = @'
  if (loadingProfile) {
    return (
      <PageTransition className="space-y-6 pb-10">
        <AdminLoadingState
          variant="page"
          title="Loading settings"
          message="Fetching profile and notification settings."
          rows={4}
        />
      </PageTransition>
    );
  }
'@

$text = $text.Replace($oldLoadingProfile, $newLoadingProfile)

$beforeSettingsReturnEnd = @'
      <Reveal delay={0.16}>
        <PushNotificationSection />
      </Reveal>
    </PageTransition>
  );
}
'@

$afterSettingsReturnEnd = @'
      <Reveal delay={0.16}>
        <PushNotificationSection />
      </Reveal>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete admin account?"
        message="This will deactivate your admin account and sign you out immediately. Protected admin routes will no longer be accessible from this account."
        confirmLabel="Delete account"
        dangerText="This is a destructive account action. Confirm only if you are using a test account or you are sure this admin account should be deactivated."
        loading={deletingAccount}
        onClose={() => {
          if (!deletingAccount) {
            setDeleteDialogOpen(false);
          }
        }}
        onConfirm={() => void performDeleteAccount()}
      />
    </PageTransition>
  );
}
'@

$text = $text.Replace($beforeSettingsReturnEnd, $afterSettingsReturnEnd)

if ($text -notmatch 'deviceTokenToDeactivate') {
  $text = $text.Replace(
    '  const [deactivatingTokenId, setDeactivatingTokenId] = useState<number | null>(
    null,
  );',
    '  const [deactivatingTokenId, setDeactivatingTokenId] = useState<number | null>(
    null,
  );
  const [deviceTokenToDeactivate, setDeviceTokenToDeactivate] =
    useState<AdminDeviceToken | null>(null);'
  )
}

$oldDeactivateButton = @'
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeactivateToken(token.device_token_id)
                        }
                        disabled={
                          !token.is_active || deactivatingTokenId !== null
                        }
'@

$newDeactivateButton = @'
                      <button
                        type="button"
                        onClick={() => setDeviceTokenToDeactivate(token)}
                        disabled={
                          !token.is_active || deactivatingTokenId !== null
                        }
'@

$text = $text.Replace($oldDeactivateButton, $newDeactivateButton)

$oldPushReturnEnd = @'
        </div>
      )}
    </GlassCard>
  );
}
'@

$newPushReturnEnd = @'
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deviceTokenToDeactivate)}
        title="Deactivate device token?"
        message={
          deviceTokenToDeactivate
            ? `This will deactivate token #${deviceTokenToDeactivate.device_token_id} for ${deviceTokenToDeactivate.platform}.`
            : "This will deactivate the selected device token."
        }
        confirmLabel="Deactivate token"
        dangerText="Push notifications will no longer be sent to this saved device token."
        loading={deactivatingTokenId !== null}
        onClose={() => {
          if (deactivatingTokenId === null) {
            setDeviceTokenToDeactivate(null);
          }
        }}
        onConfirm={async () => {
          if (!deviceTokenToDeactivate) return;
          await handleDeactivateToken(deviceTokenToDeactivate.device_token_id);
          setDeviceTokenToDeactivate(null);
        }}
      />
    </GlassCard>
  );
}
'@

# Replace only the first PushNotificationSection return ending after its large block.
$lastIndex = $text.LastIndexOf($oldPushReturnEnd)
if ($lastIndex -ge 0) {
  $text = $text.Substring(0, $lastIndex) + $newPushReturnEnd + $text.Substring($lastIndex + $oldPushReturnEnd.Length)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($resolvedPath, $text, $utf8NoBom)

Write-Host "Updated $path with settings confirmation dialogs and shared settings loading state."
