"use client";

interface Step {
  id: string;
  label: string;
  icon: string;
  step: number;
}

interface ProcessingStepsProps {
  currentStep: string;
  steps: Step[];
}

export default function ProcessingSteps({ currentStep, steps }: ProcessingStepsProps) {
  const getStepIndex = (step: string) => steps.findIndex((s) => s.id === step);
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0",
        marginTop: "32px",
        overflowX: "auto",
        paddingBottom: "8px",
      }}
    >
      {steps.map((step, index) => {
        const isDone = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        const isPending = index > currentStepIndex;

        return (
          <div
            key={step.id}
            style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            {/* Step node */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                opacity: isPending ? 0.35 : 1,
                transition: "opacity 0.4s ease, transform 0.4s ease",
                transform: isPending ? "scale(0.93)" : "scale(1)",
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  transition: "all 0.4s ease",
                  background: isDone
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : isActive
                    ? "linear-gradient(135deg, #8b5cf6, #6d28d9)"
                    : "rgba(255,255,255,0.06)",
                  border: isActive
                    ? "2px solid rgba(139,92,246,0.5)"
                    : "2px solid transparent",
                  boxShadow: isDone
                    ? "0 4px 16px rgba(16,185,129,0.3)"
                    : isActive
                    ? "0 4px 20px rgba(139,92,246,0.5)"
                    : "none",
                  animation: isActive ? "progress-glow 2s ease-in-out infinite" : "none",
                }}
              >
                {isDone ? (
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="white"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: isActive ? 700 : 500,
                  color: isDone
                    ? "var(--success)"
                    : isActive
                    ? "var(--accent-light)"
                    : "var(--text-muted)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.01em",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div
                style={{
                  width: "clamp(24px, 4vw, 60px)",
                  height: "2px",
                  marginBottom: "20px",
                  marginLeft: "8px",
                  marginRight: "8px",
                  borderRadius: "99px",
                  background: isDone
                    ? "linear-gradient(90deg, #10b981, #059669)"
                    : "rgba(255,255,255,0.06)",
                  transition: "background 0.5s ease",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
