import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthFetch } from "@/hooks/use-auth";
import heroAuth from "@assets/hero-auth.jpg";
import tourJournal from "@assets/tour-journal.jpg";
import tourFood from "@assets/tour-food.jpg";
import tourFitness from "@assets/tour-fitness.jpg";
import tourAchieve from "@assets/tour-achieve.jpg";
import tourCalm from "@assets/tour-calm.jpg";

interface AppTourProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    image: heroAuth,
    title: "Welcome to Vitallity",
    description: "Your personal wellness companion. We learn about you to create a plan that actually works -- not a cookie-cutter program.",
  },
  {
    image: tourJournal,
    title: "Tell Us About You",
    description: "Complete your health profile so we can personalize everything. It covers your health history, lifestyle, diet, and goals.",
  },
  {
    image: tourFood,
    title: "Daily Check-ins",
    description: "Log your mood, food, activity, and sleep daily. Our AI coach adapts your plan based on how you're actually doing.",
  },
  {
    image: tourFitness,
    title: "Track Everything",
    description: "Track calories, macros, steps, sleep quality, stress, and more. Export to Google Sheets anytime.",
  },
  {
    image: tourAchieve,
    title: "Earn Rewards",
    description: "Complete your profile, log daily, maintain streaks -- earn badges and points. Level up from Beginner to Legend.",
  },
  {
    image: tourCalm,
    title: "Chat with Your AI Coach",
    description: "Ask questions, get personalized advice, or just vent. Your AI coach knows your health history and adapts to you.",
  },
];

export default function AppTour({ onComplete }: AppTourProps) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const authFetch = useAuthFetch();

  const isLast = current === SLIDES.length - 1;

  const handleComplete = useCallback(async () => {
    try {
      await authFetch("POST", "/api/user/tour-complete");
    } catch {}
    onComplete();
  }, [authFetch, onComplete]);

  const next = () => {
    if (isLast) {
      handleComplete();
    } else {
      setDirection("left");
      setCurrent(c => c + 1);
    }
  };

  const prev = () => {
    if (current > 0) {
      setDirection("right");
      setCurrent(c => c - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50 && !isLast) {
      setDirection("left");
      setCurrent(c => c + 1);
    }
    if (diff < -50 && current > 0) {
      setDirection("right");
      setCurrent(c => c - 1);
    }
    setTouchStart(null);
  };

  const slide = SLIDES[current];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      data-testid="app-tour"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-bleed background image */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
      ))}

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Skip button */}
        <div className="flex justify-end p-5">
          <button
            data-testid="tour-skip"
            onClick={handleComplete}
            className="text-sm text-white/60 hover:text-white transition-colors font-medium px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-sm"
          >
            Skip
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom glass panel */}
        <div className="px-5 pb-8">
          <div className="glass-card-dark p-6 mb-6" data-testid="tour-content">
            <h1
              className="font-display text-2xl font-bold text-white mb-3"
              data-testid="tour-slide-title"
              key={`title-${current}`}
              style={{ animation: "fadeInUp 0.4s ease-out both" }}
            >
              {slide.title}
            </h1>
            <p
              className="text-white/70 text-sm leading-relaxed"
              key={`desc-${current}`}
              style={{ animation: "fadeInUp 0.4s ease-out 0.1s both" }}
            >
              {slide.description}
            </p>
          </div>

          {/* Dots + Navigation */}
          <div className="flex items-center justify-between">
            {/* Dot indicators */}
            <div className="flex items-center gap-2" data-testid="tour-dots">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? "bg-white w-6"
                      : "bg-white/30 w-1.5"
                  }`}
                />
              ))}
            </div>

            {/* Nav buttons */}
            <div className="flex items-center gap-2">
              {current > 0 && (
                <button
                  data-testid="tour-prev"
                  onClick={prev}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <button
                data-testid="tour-next"
                onClick={next}
                className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 hover:bg-white/90 transition-all active:scale-[0.97]"
              >
                {isLast ? "Get Started" : "Next"}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
