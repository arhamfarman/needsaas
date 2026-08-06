'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Package, Lightbulb, Star, FileText, PackageCheck,
  Crown, DollarSign, AlertCircle, TrendingUp, ArrowRight,
} from 'lucide-react';

type Stats = {
  users: number;
  products: number;
  needs: number;
  reviews: number;
  blogPosts: number;
  starterPacks: number;
  proBuilders: number;
  totalRewards: number;
  pendingProducts: number;
  openNeeds: number;
  reportedReviews: number;
  draftPosts: number;
};

const statCards = [
  { key: 'users', label: 'Total Users', icon: Users, href: '/admin/users', color: 'text-blue-600 bg-blue-50' },
  { key: 'products', label: 'Published Software', icon: Package, href: '/admin/software', color: 'text-emerald-600 bg-emerald-50' },
  { key: 'needs', label: 'Total Needs', icon: Lightbulb, href: '/admin/needs', color: 'text-amber-600 bg-amber-50' },
  { key: 'reviews', label: 'Reviews', icon: Star, href: '/admin/reviews', color: 'text-purple-600 bg-purple-50' },
  { key: 'blogPosts', label: 'Blog Posts', icon: FileText, href: '/admin/blog', color: 'text-cyan-600 bg-cyan-50' },
  { key: 'starterPacks', label: 'Starter Packs', icon: PackageCheck, href: '/admin/starter-packs', color: 'text-pink-600 bg-pink-50' },
  { key: 'proBuilders', label: 'Pro Builders', icon: Crown, href: '/admin/builders', color: 'text-orange-600 bg-orange-50' },
  { key: 'totalRewards', label: 'Reward Pools', icon: DollarSign, href: '/admin/rewards', color: 'text-green-600 bg-green-50', isCurrency: true },
] as const;

const alerts = [
  { key: 'pendingProducts', label: 'Pending software approvals', href: '/admin/software', icon: Package },
  { key: 'openNeeds', label: 'Open needs', href: '/admin/needs', icon: Lightbulb },
  { key: 'reportedReviews', label: 'Reported reviews', href: '/admin/reviews', icon: AlertCircle },
  { key: 'draftPosts', label: 'Draft blog posts', href: '/admin/blog', icon: FileText },
] as const;

export function AdminOverview({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview and pending actions.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const value = (stats as any)[card.key] as number;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                href={card.href}
                className="group block rounded-2xl border border-border/60 bg-card p-5 shadow-card transition hover:border-brand/20 hover:shadow-card-hover"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="font-display text-2xl font-bold text-foreground">
                  {(card as any).isCurrency ? `$${value.toLocaleString()}` : value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <AlertCircle className="h-5 w-5 text-brand" /> Action Items
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {alerts.map((alert) => {
            const count = (stats as any)[alert.key] as number;
            if (count === 0) return null;
            return (
              <Link
                key={alert.key}
                href={alert.href}
                className="group flex items-center justify-between rounded-xl border border-border/40 p-4 transition hover:border-brand/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <alert.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-foreground">{count} {alert.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-brand" />
              </Link>
            );
          })}
          {alerts.every((a) => (stats as any)[a.key] === 0) && (
            <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">
              No pending actions.
            </p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Write a blog post', href: '/admin/blog', desc: 'Create content for your audience' },
          { label: 'Create a starter pack', href: '/admin/starter-packs', desc: 'Curate software collections' },
          { label: 'View analytics', href: '/admin/analytics', desc: 'Track platform performance' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-border/60 bg-card p-5 transition hover:border-brand/20 hover:shadow-card"
          >
            <h3 className="font-medium text-foreground group-hover:text-brand">{link.label}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{link.desc}</p>
            <span className="mt-3 flex items-center gap-1 text-xs font-medium text-brand">
              Go <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
