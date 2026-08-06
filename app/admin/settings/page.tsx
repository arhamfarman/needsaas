'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Save,
  Loader2,
  Settings as SettingsIcon,
  Globe,
  ToggleLeft,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const STORAGE_KEY = 'needsaas_admin_settings';

type FeatureToggles = {
  starterPacks: boolean;
  blog: boolean;
  opportunityFeed: boolean;
  reviews: boolean;
};

type Settings = {
  platformName: string;
  proBuilderPrice: string;
  features: FeatureToggles;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
};

const DEFAULTS: Settings = {
  platformName: 'NeedSaaS',
  proBuilderPrice: '$15/month',
  features: {
    starterPacks: true,
    blog: true,
    opportunityFeed: true,
    reviews: true,
  },
  defaultMetaTitle: 'NeedSaaS — Discover and build software people need',
  defaultMetaDescription:
    'Find the software tools you need, request features, and connect with builders who can create them.',
};

const FEATURE_META: { key: keyof FeatureToggles; label: string; description: string }[] = [
  { key: 'starterPacks', label: 'Enable starter packs', description: 'Curated software collections for common use cases.' },
  { key: 'blog', label: 'Enable blog', description: 'Publish articles and content marketing posts.' },
  { key: 'opportunityFeed', label: 'Enable opportunity feed', description: 'Show builders high-value needs they can fulfill.' },
  { key: 'reviews', label: 'Enable reviews', description: 'Allow users to review and rate products.' },
];

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      platformName: parsed.platformName ?? DEFAULTS.platformName,
      proBuilderPrice: parsed.proBuilderPrice ?? DEFAULTS.proBuilderPrice,
      features: {
        starterPacks: parsed.features?.starterPacks ?? DEFAULTS.features.starterPacks,
        blog: parsed.features?.blog ?? DEFAULTS.features.blog,
        opportunityFeed: parsed.features?.opportunityFeed ?? DEFAULTS.features.opportunityFeed,
        reviews: parsed.features?.reviews ?? DEFAULTS.features.reviews,
      },
      defaultMetaTitle: parsed.defaultMetaTitle ?? DEFAULTS.defaultMetaTitle,
      defaultMetaDescription: parsed.defaultMetaDescription ?? DEFAULTS.defaultMetaDescription,
    };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(settings: Settings): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const initialRef = React.useRef<string>('');

  // Load from localStorage on mount
  React.useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    initialRef.current = JSON.stringify(loaded);
    setLoaded(true);
  }, []);

  // Track changes against the initial loaded snapshot
  React.useEffect(() => {
    if (!loaded) return;
    setHasChanges(JSON.stringify(settings) !== initialRef.current);
  }, [settings, loaded]);

  const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateFeature = (key: keyof FeatureToggles, value: boolean) => {
    setSettings((prev) => ({ ...prev, features: { ...prev.features, [key]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate async for nicer UX; localStorage is synchronous
      saveSettings(settings);
      initialRef.current = JSON.stringify(settings);
      setHasChanges(false);
      await new Promise((r) => setTimeout(r, 300));
      toast.success('Settings saved', {
        description: 'Your platform settings have been updated.',
      });
    } catch (err) {
      toast.error('Failed to save settings', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    toast.info('Reset to defaults', {
      description: 'Click Save to persist the default values.',
    });
  };

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure platform-wide preferences. Settings are stored locally in your browser.
        </p>
      </div>

      {/* Platform section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 rounded-2xl border border-border/60 bg-card p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <SettingsIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Platform</h2>
            <p className="text-xs text-muted-foreground">Core identity and pricing.</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="platform-name">Platform name</Label>
            <Input
              id="platform-name"
              value={settings.platformName}
              onChange={(e) => updateField('platformName', e.target.value)}
              placeholder="NeedSaaS"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pro-price">Pro Builder price</Label>
            <Input
              id="pro-price"
              value={settings.proBuilderPrice}
              onChange={(e) => updateField('proBuilderPrice', e.target.value)}
              placeholder="$15/month"
            />
            <p className="text-xs text-muted-foreground">
              Displayed on upgrade prompts and the pricing page.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Feature toggles */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-6 rounded-2xl border border-border/60 bg-card p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <ToggleLeft className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Feature Toggles</h2>
            <p className="text-xs text-muted-foreground">Enable or disable platform features.</p>
          </div>
        </div>

        <div className="space-y-1">
          {FEATURE_META.map((feat) => (
            <div
              key={feat.key}
              className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <Label htmlFor={`feat-${feat.key}`} className="cursor-pointer text-sm font-medium">
                  {feat.label}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">{feat.description}</p>
              </div>
              <Switch
                id={`feat-${feat.key}`}
                checked={settings.features[feat.key]}
                onCheckedChange={(v) => updateFeature(feat.key, v)}
              />
            </div>
          ))}
        </div>
      </motion.section>

      {/* SEO defaults */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6 rounded-2xl border border-border/60 bg-card p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">SEO Defaults</h2>
            <p className="text-xs text-muted-foreground">
              Default metadata used when a page doesn&apos;t specify its own.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="meta-title">Default meta title</Label>
            <Input
              id="meta-title"
              value={settings.defaultMetaTitle}
              onChange={(e) => updateField('defaultMetaTitle', e.target.value)}
              placeholder="Default page title"
            />
            <p className="text-xs text-muted-foreground">
              {settings.defaultMetaTitle.length}/60 characters
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meta-desc">Default meta description</Label>
            <Textarea
              id="meta-desc"
              value={settings.defaultMetaDescription}
              onChange={(e) => updateField('defaultMetaDescription', e.target.value)}
              placeholder="Default page description"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {settings.defaultMetaDescription.length}/160 characters
            </p>
          </div>
        </div>
      </motion.section>

      <Separator className="my-6" />

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={handleReset} disabled={saving}>
          <Sparkles className="mr-2 h-4 w-4" /> Reset to defaults
        </Button>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
