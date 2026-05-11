import { Icons, ScreenType } from '../../constants';

interface RecentActivityProps {
  loading: boolean;
  recentFindings: any[];
  onNavigate: (screen: ScreenType) => void;
}

export function RecentActivity({ loading, recentFindings, onNavigate }: RecentActivityProps) {
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-primary font-display">Siste oppdagelser</h3>
        <button onClick={() => onNavigate('collection')} className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">Se alle</button>
      </div>
      <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-4 shadow-sm border border-outline-variant/30">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentFindings.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Begynn å skanne for å se aktivitet!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentFindings.map((item) => (
              <div key={item.id} className="flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <img src={item.imageUrl} alt={item.speciesName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-primary text-sm truncate">{item.speciesName}</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    {item.collectedAt?.toDate && new Date(item.collectedAt.toDate()).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('collection')}
                  className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
