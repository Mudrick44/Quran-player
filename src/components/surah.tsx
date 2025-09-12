interface SurahData {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
}

interface SurahProps {
  number: number;
  data: SurahData;
  onClick?: () => void;
}

const Surah = ({
  number,
  data,
  onClick,
}: SurahProps) => {
  return (
    <div
      className="group cursor-pointer flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-opacity-50"
      style={{ '--hover-bg': 'var(--sidebar-selected)' } as React.CSSProperties}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-selected)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      onClick={onClick}
    >
      {/* Small square artwork placeholder */}
      <div 
        className="w-12 h-12 rounded-md flex items-center justify-center text-sm font-semibold text-white mr-4 flex-shrink-0"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      >
        {number}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 
            className="text-base font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {data.surahName}
          </h4>
          
          {/* Play button - only visible on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
              <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        <p 
          className="text-sm truncate"
          style={{ color: 'var(--text-secondary)' }}
        >
          {data.surahNameArabic} • {data.surahNameTranslation}
        </p>
        
        <p 
          className="text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {data.totalAyah} verses • {data.revelationPlace === 'Mecca' ? 'Meccan' : 'Medinan'}
        </p>
      </div>
    </div>
  );
};

export default Surah;