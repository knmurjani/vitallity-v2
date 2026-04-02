import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface BadgeNotification {
  id: string;
  name: string;
  description: string;
  iconType: string;
  pointsAwarded: number;
  tier: string;
}

interface BadgeContextType {
  notifications: BadgeNotification[];
  showBadge: (badge: BadgeNotification) => void;
  dismissBadge: (id: string) => void;
  processBadgeResponse: (data: any) => void;
}

const BadgeContext = createContext<BadgeContextType | null>(null);

export function BadgeProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<BadgeNotification[]>([]);

  const showBadge = useCallback((badge: BadgeNotification) => {
    setNotifications(prev => [...prev, badge]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== badge.id));
    }, 3000);
  }, []);

  const dismissBadge = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const processBadgeResponse = useCallback((data: any) => {
    if (data?.newBadges && Array.isArray(data.newBadges)) {
      for (const badge of data.newBadges) {
        showBadge({
          id: `badge-${badge.id}-${Date.now()}`,
          name: badge.name,
          description: badge.description,
          iconType: badge.iconType,
          pointsAwarded: badge.pointsAwarded,
          tier: badge.tier,
        });
      }
    }
  }, [showBadge]);

  return (
    <BadgeContext.Provider value={{ notifications, showBadge, dismissBadge, processBadgeResponse }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadgeNotifications() {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error("useBadgeNotifications must be used within BadgeProvider");
  return ctx;
}
