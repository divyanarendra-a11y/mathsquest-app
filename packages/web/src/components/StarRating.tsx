interface StarRatingProps {
  stars: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClass = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

export function StarRating({ stars, maxStars = 3, size = 'md' }: StarRatingProps) {
  return (
    <div className={`flex gap-0.5 ${sizeClass[size]}`} aria-label={`${stars} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <span key={i} className={i < stars ? 'text-yellow-400' : 'text-gray-600'}>
          ★
        </span>
      ))}
    </div>
  );
}
