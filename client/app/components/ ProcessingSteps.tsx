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

export default function ProcessingSteps({
  currentStep,
  steps,
}: ProcessingStepsProps) {
  const getStepIndex = (step: string) =>
    steps.findIndex((s) => s.id === step);

  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="mt-8 flex justify-center items-center gap-2 md:gap-4 overflow-x-auto pb-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center shrink-0">
          <div
            className={`flex flex-col items-center transition-all duration-500 ${
              index <= currentStepIndex
                ? "opacity-100 scale-100"
                : "opacity-40 scale-95"
            }`}
          >
            <div
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-500 ${
                index < currentStepIndex
                  ? "bg-linear-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/50"
                  : index === currentStepIndex
                  ? "bg-linear-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/50 animate-pulse"
                  : "bg-gray-200"
              }`}
            >
              {index < currentStepIndex ? "✓" : step.icon}
            </div>
            <span
              className={`text-xs md:text-sm mt-2 font-semibold whitespace-nowrap ${
                index <= currentStepIndex ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 md:w-16 h-1 mx-2 rounded-full transition-all duration-500 ${
                index < currentStepIndex
                  ? "bg-linear-to-r from-green-400 to-emerald-500"
                  : "bg-gray-200"
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
}
