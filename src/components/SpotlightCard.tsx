import React, { useRef } from 'react';
import './SpotlightCard.css';

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  // Loosened from the original `` `rgba(${number}, ${number}, ${number},
  // ${number})` `` template-literal type to plain `string`. That narrower
  // type only accepts a literal rgba() written directly in the prop
  // position — it can't accept a value derived from another color at
  // runtime (e.g. a Framer-driven accent color), which is exactly how
  // SkillpathCourses.tsx needs to use this. Nothing about the component's
  // internals actually depends on the value being rgba() specifically —
  // it's interpolated straight into a CSS custom property — so `string`
  // is the more honest type here, not a safety loss.
  spotlightColor?: string;
  // Forwarded straight onto the root div's inline style, alongside
  // whatever --mouse-x/--mouse-y/--spotlight-color get set imperatively
  // in handleMouseMove below — needed so a caller can still pass through
  // things like a dynamic border-radius without this component having to
  // know about every possible style a wrapped card might need.
  style?: React.CSSProperties;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
  style
}) => {
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <div ref={divRef} onMouseMove={handleMouseMove} className={`card-spotlight ${className}`} style={style}>
      {children}
    </div>
  );
};

export default SpotlightCard;
