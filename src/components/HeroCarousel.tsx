import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import image1 from "@/assets/gallery/youth-outdoor-1.jpg";
import image2 from "@/assets/gallery/youth-outdoor-2.jpg";
import image3 from "@/assets/gallery/mentoring.jpg";

const slides = [
  {
    image: image1,
    title: "GOSPEL",
    subtitle: "Changing a Generation through the Teaching of the Word of Faith and the Release of the Supernatural.",
    accent: "The Word of Faith",
  },
  {
    image: image2,
    title: "GROWTH",
    subtitle: "Committed to Growing a Community of Strong Men and Women in every aspect and works of Life.",
    accent: "Strong Communities",
  },
  {
    image: image3,
    title: "GOLD",
    subtitle: "Prosperity is God's will for Every Believer. We raise a Joyful and Prosperous Family.",
    accent: "Divine Prosperity",
  },
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  return (
    <div className="relative h-[550px] md:h-[650px] lg:h-[700px] overflow-hidden">
      {/* Background slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${
            index === currentSlide 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-105"
          }`}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent z-10" />
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl z-10 animate-float" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl z-10" />
          
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  index === currentSlide
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8 absolute"
                }`}
              >
                {index === currentSlide && (
                  <>
                    {/* Accent badge */}
                    <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm text-accent px-4 py-2 rounded-full mb-6 animate-fade-in">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">{slide.accent}</span>
                    </div>

                    {/* Title */}
                    <h1 
                      className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 animate-fade-in-up"
                      style={{ animationDelay: '0.1s' }}
                    >
                      {slide.title}
                    </h1>

                    {/* Subtitle */}
                    <p 
                      className="text-lg md:text-xl text-white/90 leading-relaxed mb-8 animate-fade-in-up"
                      style={{ animationDelay: '0.2s' }}
                    >
                      {slide.subtitle}
                    </p>

                    {/* CTA buttons */}
                    <div 
                      className="flex flex-wrap gap-4 animate-fade-in-up"
                      style={{ animationDelay: '0.3s' }}
                    >
                      <Button 
                        size="lg" 
                        className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-gold transition-smooth"
                        onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        Get In Touch
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-smooth"
                        onClick={() => window.location.href = '/gospel-buddy'}
                      >
                        Try GospelBuddy AI
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-smooth border border-white/20"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-smooth border border-white/20"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === currentSlide 
                ? "bg-accent w-8" 
                : "bg-white/40 w-2 hover:bg-white/60"
            }`}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentSlide(index);
                setTimeout(() => setIsTransitioning(false), 800);
              }
            }}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 z-30 hidden lg:flex flex-col items-center gap-2 text-white/60">
        <span className="text-xs tracking-widest rotate-90 origin-center translate-x-4">SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/60 to-transparent animate-pulse-soft" />
      </div>
    </div>
  );
};

export default HeroCarousel;
