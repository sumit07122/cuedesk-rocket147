import React, { useState } from 'react';
import { Trophy, Plus, Users, Calendar, Award, Play, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import { Tournament, TournamentMatch } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { exportTournamentsToExcel } from '../../utils/excelExport';

interface TournamentViewProps {
  currencySymbol: string;
}

export const TournamentView: React.FC<TournamentViewProps> = ({ currencySymbol }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: 'tourney-1',
      title: 'One Shot Open Snooker Cup 2026',
      entryFee: 500,
      prizePool: 4000,
      status: 'ongoing',
      startDate: '2026-08-05',
      winner: undefined,
      matches: [
        { id: 'm1', round: 1, player1: 'Rahul Sharma', player2: 'Vikas Verma', score1: 3, score2: 1, winner: 'Rahul Sharma', status: 'completed', tableNumber: 1 },
        { id: 'm2', round: 1, player1: 'Amit Patel', player2: 'Karan Singh', score1: 2, score2: 3, winner: 'Karan Singh', status: 'completed', tableNumber: 2 },
        { id: 'm3', round: 1, player1: 'Sameer Khan', player2: 'Rohan Gupta', score1: 0, score2: 0, status: 'live', tableNumber: 3 },
        { id: 'm4', round: 1, player1: 'Manish Kumar', player2: 'Deepak Joshi', score1: 0, score2: 0, status: 'upcoming', tableNumber: 4 },
        { id: 'm5', round: 2, player1: 'Rahul Sharma', player2: 'Karan Singh', score1: 0, score2: 0, status: 'upcoming' },
        { id: 'm6', round: 2, player1: 'TBD', player2: 'TBD', score1: 0, score2: 0, status: 'upcoming' },
        { id: 'm7', round: 3, player1: 'TBD', player2: 'TBD', score1: 0, score2: 0, status: 'upcoming' },
      ]
    }
  ]);

  const [activeTourney, setActiveTourney] = useState<Tournament>(tournaments[0]);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  const handleUpdateMatchScore = () => {
    if (!selectedMatch || !activeTourney) return;

    const winner = score1 > score2 ? selectedMatch.player1 : score2 > score1 ? selectedMatch.player2 : undefined;
    const updatedMatches = activeTourney.matches.map(m => {
      if (m.id === selectedMatch.id) {
        return {
          ...m,
          score1,
          score2,
          winner,
          status: winner ? ('completed' as const) : ('live' as const),
        };
      }
      return m;
    });

    const updatedTourney = { ...activeTourney, matches: updatedMatches };
    setActiveTourney(updatedTourney);
    setTournaments(prev => prev.map(t => t.id === updatedTourney.id ? updatedTourney : t));
    setSelectedMatch(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Snooker & Pool Tournament Bracket</h1>
            <p className="text-sm text-neutral-400">Knockout tournament manager, live match scoring & prize pool tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800"
            onClick={() => exportTournamentsToExcel(tournaments)}
            leftIcon={<Download className="w-4 h-4 text-amber-400" />}
            size="sm"
          >
            Export Tournament (.csv)
          </Button>
          <div className="bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-700 text-center">
            <span className="text-xs font-medium text-neutral-400 block">Total Prize Pool</span>
            <span className="text-xl font-bold text-emerald-400">{formatCurrency(activeTourney?.prizePool || 0, currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* Matches Bracket View */}
      {activeTourney && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">{activeTourney.title}</h2>
            <Badge variant="warning">IN PROGRESS</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Round 1: Quarter Finals */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-lg">
                Quarter Finals (Best of 5)
              </h3>
              {activeTourney.matches.filter(m => m.round === 1).map((match) => (
                <Card
                  key={match.id}
                  className="p-4 border hover:border-neutral-400 transition-all cursor-pointer space-y-2"
                  onClick={() => {
                    setSelectedMatch(match);
                    setScore1(match.score1);
                    setScore2(match.score2);
                  }}
                >
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold border-b pb-1.5">
                    <span>Table #{match.tableNumber || 1}</span>
                    <Badge variant={match.status === 'completed' ? 'default' : match.status === 'live' ? 'success' : 'outline'}>
                      {match.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm font-bold">
                    <div className={`flex justify-between ${match.winner === match.player1 ? 'text-emerald-700 font-extrabold' : 'text-neutral-800'}`}>
                      <span>{match.player1}</span>
                      <span>{match.score1}</span>
                    </div>
                    <div className={`flex justify-between ${match.winner === match.player2 ? 'text-emerald-700 font-extrabold' : 'text-neutral-800'}`}>
                      <span>{match.player2}</span>
                      <span>{match.score2}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Round 2: Semi Finals */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-lg">
                Semi Finals
              </h3>
              {activeTourney.matches.filter(m => m.round === 2).map((match) => (
                <Card
                  key={match.id}
                  className="p-4 border hover:border-neutral-400 transition-all cursor-pointer space-y-2"
                  onClick={() => {
                    setSelectedMatch(match);
                    setScore1(match.score1);
                    setScore2(match.score2);
                  }}
                >
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold border-b pb-1.5">
                    <span>Semi Final</span>
                    <Badge variant="outline">{match.status.toUpperCase()}</Badge>
                  </div>
                  <div className="space-y-1 text-sm font-bold">
                    <div className="flex justify-between text-neutral-800">
                      <span>{match.player1}</span>
                      <span>{match.score1}</span>
                    </div>
                    <div className="flex justify-between text-neutral-800">
                      <span>{match.player2}</span>
                      <span>{match.score2}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Round 3: Grand Final */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                Grand Final Championship
              </h3>
              {activeTourney.matches.filter(m => m.round === 3).map((match) => (
                <Card
                  key={match.id}
                  className="p-5 border-2 border-amber-300 bg-amber-50/20 shadow-md space-y-3 cursor-pointer"
                  onClick={() => {
                    setSelectedMatch(match);
                    setScore1(match.score1);
                    setScore2(match.score2);
                  }}
                >
                  <div className="text-center font-extrabold text-amber-800 text-xs tracking-wider uppercase">
                    Championship Match
                  </div>
                  <div className="space-y-2 text-base font-black text-neutral-900">
                    <div className="flex justify-between bg-white p-2 rounded-xl border">
                      <span>{match.player1}</span>
                      <span>{match.score1}</span>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border">
                      <span>{match.player2}</span>
                      <span>{match.score2}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match Score Modal */}
      {selectedMatch && (
        <Modal
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          title="Update Live Match Frames"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
              <span className="font-bold text-neutral-800">{selectedMatch.player1}</span>
              <Input
                type="number"
                value={score1}
                onChange={(e) => setScore1(Number(e.target.value))}
                className="w-20 text-center font-bold text-lg"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
              <span className="font-bold text-neutral-800">{selectedMatch.player2}</span>
              <Input
                type="number"
                value={score2}
                onChange={(e) => setScore2(Number(e.target.value))}
                className="w-20 text-center font-bold text-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="ghost" onClick={() => setSelectedMatch(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleUpdateMatchScore}>Save Frame Scores</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
