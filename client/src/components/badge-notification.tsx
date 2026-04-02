import { useBadgeNotifications } from "@/contexts/badge-context";
import { Trophy, Flame, Star, Heart, Target, Zap, Crown, Shield, X } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  flame: Flame,
  star: Star,
  heart: Heart,
  target: Target,
  zap: Zap,
  crown: Crown,
  shield: Shield,
};

export default function BadgeNotificationOverlay() {
  const { notifications, dismissBadge } = useBadgeNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      {notifications.map(n => {
        const Icon = ICON_MAP[n.iconType] || Trophy;
        const tierColor = TIER_COLORS[n.tier] || TIER_COLORS.bronze;
        return (
          <div
            key={n.id}
            data-testid="badge-notification"
            className="pointer-events-auto bg-white rounded-2xl shadow-lg border px-4 py-3 flex items-center gap-3 max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in duration-300"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${tierColor}20`, color: tierColor }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Achievement Unlocked!</p>
              <p className="text-sm font-semibold truncate">{n.name}</p>
              <p className="text-xs text-primary font-medium">+{n.pointsAwarded} pts</p>
            </div>
            <button
              data-testid="dismiss-badge-notification"
              onClick={() => dismissBadge(n.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
