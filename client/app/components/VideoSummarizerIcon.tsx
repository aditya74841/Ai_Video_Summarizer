// Create a file: components/VideoSummarizerIcon.tsx
export default function VideoSummarizerIcon({ className = "w-8 h-8" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 8L14 11L9 14V8Z" fill="currentColor"/>
      <path d="M4 20H20M8 20L8 17M16 20L16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="6" r="2" fill="#10b981" stroke="white" strokeWidth="1.5"/>
      <path d="M14 19H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
