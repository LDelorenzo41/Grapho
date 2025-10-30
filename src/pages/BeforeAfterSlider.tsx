import { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({ 
  beforeImage, 
  afterImage, 
  beforeLabel = "Avant",
  afterLabel = "Après" 
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    // Limiter entre 0 et 100
    const boundedPercentage = Math.min(Math.max(percentage, 0), 100);
    setSliderPosition(boundedPercentage);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="max-w-4xl mx-auto">
      <div 
        ref={containerRef}
        className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-2xl cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* Image "Après" (en arrière-plan, à droite) */}
        <div className="absolute inset-0">
          <img 
            src={afterImage} 
            alt={afterLabel}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Label "Après" */}
          <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
            {afterLabel}
          </div>
        </div>

        {/* Image "Avant" (au premier plan, à gauche) avec clip-path */}
        <div 
          className="absolute inset-0 transition-all duration-0"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
          }}
        >
          <img 
            src={beforeImage} 
            alt={beforeLabel}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Label "Avant" */}
          <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
            {beforeLabel}
          </div>
        </div>

        {/* Barre de séparation avec poignée */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Poignée centrale */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-gray-200">
            <div className="flex gap-1">
              <div className="w-1 h-6 bg-gray-400 rounded"></div>
              <div className="w-1 h-6 bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center text-gray-600 mt-4 font-body">
        ← Glissez la barre pour comparer →
      </p>
    </div>
  );
}