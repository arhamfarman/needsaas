import {
  Zap, Code2, BrainCircuit, PenTool, Megaphone, BarChart3,
  MessageSquare, Wallet, ShoppingBag, Users, GraduationCap,
  HeartPulse, LayoutGrid, type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  Zap, Code2, BrainCircuit, PenTool, Megaphone, BarChart3,
  MessageSquare, Wallet, ShoppingBag, Users, GraduationCap,
  HeartPulse, LayoutGrid,
};

export function categoryIcon(name: string | null | undefined): LucideIcon {
  if (!name) return LayoutGrid;
  return MAP[name] ?? LayoutGrid;
}
