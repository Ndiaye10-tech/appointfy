import React from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { ShieldCheck, TrendingUp, AlertTriangle, CalendarCheck, Zap, Sparkles } from 'lucide-react';

export const DashboardMetrics = () => {
  const { stats } = useBooking();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      
      {/* 1. Acomptes Sécurisés */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-pink-600">Acomptes Sécurisés</span>
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-950">
          {formatFCFA(stats.totalSecuredDeposits)}
        </div>
        <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
          <span>{stats.totalSecuredDeposits > 0 ? '↑ 100% garanti Wave' : 'Aucun acompte pour le moment'}</span>
        </p>
      </div>

      {/* 2. Taux d'assiduité */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-pink-600">Taux de Présence</span>
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-950">
          {stats.totalHonorables + stats.totalNoShows > 0 ? `${stats.reliabilityRate} %` : '—'}
        </div>
        <p className="text-[11px] text-slate-500 font-medium mt-1">
          {stats.totalHonorables + stats.totalNoShows > 0
            ? `${stats.totalHonorables} honoré(s) vs ${stats.totalNoShows} lapin(s)`
            : 'En attente des premiers rendez-vous'}
        </p>
      </div>

      {/* 3. Pertes Évitées */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">Pertes Évitées</span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-rose-600">
          {formatFCFA(stats.noShowRecoveredRevenue)}
        </div>
        <p className="text-[11px] text-slate-500 font-medium mt-1">
          {stats.noShowRecoveredRevenue > 0
            ? 'Acomptes conservés sur les no-shows'
            : 'Aucune perte financière'}
        </p>
      </div>

      {/* 4. RDV Confirmés */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-pink-600">RDV Confirmés</span>
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-950">
          {stats.totalConfirmed}
        </div>
        <p className="text-[11px] text-pink-600 font-bold mt-1 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {stats.totalConfirmed > 0 ? 'À venir très prochainement' : 'En attente de réservation'}
        </p>
      </div>

    </div>
  );
};
