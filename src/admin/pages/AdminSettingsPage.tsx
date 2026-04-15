import { useEffect, useState } from 'react';
import {
  disconnectMeta,
  fetchMetaSettings,
  getApiErrorMessage,
  saveMetaSettings,
  testMetaConnection,
} from '../api/admin';
import { useAdminAuth } from '../auth/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import type { MetaSettings } from '../types';
import { formatDate } from '../utils/format';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plug,
  PlugZap,
  Save,
  Shield,
  Unplug,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';

const defaultSettings: MetaSettings = {
  accessToken: '',
  verifyToken: '',
  pageId: '',
  isConnected: false,
};

export default function AdminSettingsPage() {
  const { refreshAdmin, logout } = useAdminAuth();
  const [settings, setSettings] = useState<MetaSettings>(defaultSettings);
  const [formToken, setFormToken] = useState('');
  const [formVerify, setFormVerify] = useState('');
  const [formPageId, setFormPageId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ connected: boolean; error?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const admin = await refreshAdmin();
        if (!admin || !isMounted) return;
        const data = await fetchMetaSettings();
        if (!isMounted) return;
        setSettings(data);
        setFormToken(data.accessToken || '');
        setFormVerify(data.verifyToken || '');
        setFormPageId(data.pageId || '');
      } catch (err) {
        const message = getApiErrorMessage(err, 'Unable to load settings.');
        if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('401')) {
          logout();
          return;
        }
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void load();
    return () => { isMounted = false; };
  }, [logout, refreshAdmin]);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await saveMetaSettings({
        accessToken: formToken,
        verifyToken: formVerify,
        pageId: formPageId,
      });
      setSettings(updated);
      setSuccess('Meta settings saved successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save settings.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testMetaConnection();
      setTestResult(result);
    } catch (err) {
      setTestResult({ connected: false, error: getApiErrorMessage(err, 'Connection test failed.') });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleDisconnect() {
    setIsDisconnecting(true);
    setError(null);
    try {
      await disconnectMeta();
      setSettings(defaultSettings);
      setFormToken('');
      setFormVerify('');
      setFormPageId('');
      setSuccess('Instagram account disconnected.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to disconnect.'));
    } finally {
      setIsDisconnecting(false);
    }
  }

  const hasChanges =
    formToken !== (settings.accessToken || '') ||
    formVerify !== (settings.verifyToken || '') ||
    formPageId !== (settings.pageId || '');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <section className="animate-[fadeInUp_0.5s_ease-out]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Settings
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Meta App Configuration
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-500">
              Configure your Instagram / Meta app credentials to enable AI-powered DM automation. Connect your Instagram Business account via the Graph API.
            </p>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4 text-[13px]"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#FCA5A5' }}
          >
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4 text-[13px]"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', color: '#6EE7B7' }}
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            {success}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-slate-500" size={24} />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr,0.5fr] animate-[fadeInUp_0.6s_ease-out]">
            {/* ── Left: Credentials Form ── */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))',
                    border: '1px solid rgba(236,72,153,0.1)',
                  }}
                >
                  <Key size={18} className="text-pink-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-white">API Credentials</h2>
                  <p className="text-[11px] text-slate-500">Instagram Graph API & Webhook tokens</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Access Token */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                    Instagram Access Token
                  </label>
                  <div className="relative">
                    <input
                      className="admin-input !pr-10 font-mono text-[12px]"
                      type={showToken ? 'text' : 'password'}
                      value={formToken}
                      onChange={(e) => setFormToken(e.target.value)}
                      placeholder="EAAxxxxxxxxxx..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                    >
                      {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Long-lived page access token from Meta Developer portal
                  </p>
                </div>

                {/* Verify Token */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                    Webhook Verify Token
                  </label>
                  <div className="relative">
                    <input
                      className="admin-input !pr-10 font-mono text-[12px]"
                      type={showVerify ? 'text' : 'password'}
                      value={formVerify}
                      onChange={(e) => setFormVerify(e.target.value)}
                      placeholder="your_custom_verify_token"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerify(!showVerify)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                    >
                      {showVerify ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-600">
                    Custom string used for Meta webhook subscription verification
                  </p>
                </div>

                {/* Page ID */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                    Instagram Page ID
                  </label>
                  <input
                    className="admin-input font-mono text-[12px]"
                    type="text"
                    value={formPageId}
                    onChange={(e) => setFormPageId(e.target.value)}
                    placeholder="17841400xxxxxxxx"
                  />
                  <p className="mt-1 text-[10px] text-slate-600">
                    Your Instagram Business Account ID linked to the Facebook Page
                  </p>
                </div>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving || !hasChanges}
                    className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' }}
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {isSaving ? 'Saving...' : 'Save Credentials'}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleTest()}
                    disabled={isTesting || !formToken}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-medium text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                  >
                    {isTesting ? <Loader2 size={14} className="animate-spin" /> : <PlugZap size={14} />}
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {/* Test result */}
                {testResult && (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-[12px]"
                    style={
                      testResult.connected
                        ? { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', color: '#6EE7B7' }
                        : { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#FCA5A5' }
                    }
                  >
                    {testResult.connected ? (
                      <>
                        <Wifi size={14} className="text-emerald-400" />
                        Connection successful — Instagram API is reachable.
                      </>
                    ) : (
                      <>
                        <WifiOff size={14} className="text-red-400" />
                        {testResult.error || 'Connection failed. Check your credentials.'}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Connection Status Card ── */}
            <div className="space-y-6">
              {/* Status card */}
              <div
                className="rounded-2xl border p-6"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: settings.isConnected
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(100,116,139,0.12)',
                    }}
                  >
                    {settings.isConnected ? (
                      <Plug size={18} className="text-emerald-400" />
                    ) : (
                      <Unplug size={18} className="text-slate-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-white">Connection Status</h3>
                    <p className="text-[11px] text-slate-500">Instagram Business Account</p>
                  </div>
                </div>

                {/* Status indicator */}
                <div
                  className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3"
                  style={
                    settings.isConnected
                      ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.12)' }
                      : { background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.1)' }
                  }
                >
                  <span className="relative flex h-2.5 w-2.5">
                    {settings.isConnected && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className="relative inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ background: settings.isConnected ? '#10B981' : '#64748B' }}
                    />
                  </span>
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: settings.isConnected ? '#34D399' : '#94A3B8' }}
                  >
                    {settings.isConnected ? 'Connected & Active' : 'Not Connected'}
                  </span>
                </div>

                {settings.isConnected && settings.connectedAt && (
                  <p className="mb-4 text-[11px] text-slate-500">
                    Connected since {formatDate(settings.connectedAt)}
                  </p>
                )}

                {settings.isConnected && (
                  <button
                    type="button"
                    onClick={() => void handleDisconnect()}
                    disabled={isDisconnecting}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-medium text-red-400 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/5 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ borderColor: 'rgba(239,68,68,0.15)' }}
                  >
                    {isDisconnecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect Account'}
                  </button>
                )}
              </div>

              {/* Webhook info card */}
              <div
                className="rounded-2xl border p-6"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.12)' }}
                  >
                    <Shield size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-white">Webhook Setup</h3>
                    <p className="text-[11px] text-slate-500">For Meta Developer Console</p>
                  </div>
                </div>

                <div className="space-y-3 text-[12px]">
                  <div
                    className="rounded-lg p-3"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                      Callback URL
                    </p>
                    <p className="break-all font-mono text-slate-400">
                      {import.meta.env.VITE_API_BASE_URL || 'https://your-api.com'}/api/instagram/webhook
                    </p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                      Subscribed Fields
                    </p>
                    <p className="font-mono text-slate-400">messages, messaging_postbacks</p>
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    Enter the Callback URL and Verify Token in your Meta Developer Console under Webhooks settings. Subscribe to the <span className="text-slate-400">instagram</span> product.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
