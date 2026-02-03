import { useReciters } from "../api/fetchReciters";

const RecitersSection: React.FC = () => {
  const { reciters, isLoading } = useReciters();

  return (
    <>
      <h2
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Reciters
      </h2>

      {isLoading && (
        <p style={{ color: "var(--text-primary)" }}>Loading reciters...</p>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {reciters.map((reciter: any) => (
            <div
              key={reciter.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: "var(--sidebar-selected)" }}
            >
              <h3
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {reciter.name}
              </h3>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default RecitersSection;
