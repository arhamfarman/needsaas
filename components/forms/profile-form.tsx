'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import type { Profile } from '@/lib/types';

export function ProfileForm({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const { refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile.username);
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [twitter, setTwitter] = useState(profile.twitter ?? '');
  const [github, setGithub] = useState(profile.github ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [linkedin, setLinkedin] = useState(profile.linkedin ?? '');
  const [country, setCountry] = useState(profile.country ?? '');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length < 3) { toast.error('Username must be at least 3 characters'); return; }
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      username: username.trim(),
      full_name: fullName.trim() || null,
      bio: bio.trim() || null,
      website: website.trim() || null,
      twitter: twitter.trim() || null,
      github: github.trim() || null,
      linkedin: linkedin.trim() || null,
      location: location.trim() || null,
      country: country.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile updated');
    refreshProfile();
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people what you build" rows={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Website</Label>
          <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Twitter handle</Label>
          <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="username" />
        </div>
        <div className="space-y-2">
          <Label>GitHub handle</Label>
          <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="username" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>LinkedIn</Label>
          <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="profile URL or username" />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="bg-brand text-brand-foreground hover:bg-brand/90">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save profile
      </Button>
    </form>
  );
}
