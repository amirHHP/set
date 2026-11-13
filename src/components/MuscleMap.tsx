'use client';

import React, { useState } from 'react';
import { MUSCLES, MUSCLE_LIST, MuscleInfo } from '@/lib/muscles';
import { Sparkles, Check, RotateCcw, User, Layers, Info } from 'lucide-react';

interface MuscleMapProps {
  selectedMuscles: string[];
  onChange: (muscles: string[]) => void;
  initialGender?: 'female' | 'male';
  onGenderChange?: (gender: 'female' | 'male') => void;
}

export default function MuscleMap({
  selectedMuscles,
  onChange,
  initialGender = 'female',
  onGenderChange
}: MuscleMapProps) {
  const [gender, setGender] = useState<'female' | 'male'>(initialGender);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleInfo | null>(null);

  const handleGenderToggle = (newGender: 'female' | 'male') => {
    setGender(newGender);
    if (onGenderChange) {
      onGenderChange(newGender);
    }
  };

  const toggleMuscle = (id: string) => {
    if (selectedMuscles.includes(id)) {
      onChange(selectedMuscles.filter(m => m !== id));
    } else {
      onChange([...selectedMuscles, id]);
    }
  };

  const isSelected = (id: string) => selectedMuscles.includes(id);

  const selectCategory = (category: 'upper' | 'core' | 'lower') => {
    const categoryIds = MUSCLE_LIST.filter(m => m.category === category).map(m => m.id);
    const newSelected = Array.from(new Set([...selectedMuscles, ...categoryIds]));
    onChange(newSelected);
  };

  const clearAll = () => {
    onChange([]);
  };

  // SVG Helper styles
  const getMuscleStyle = (id: string) => {
    const selected = isSelected(id);
    const hovered = hoveredMuscle?.id === id;

    return {
      fill: selected
        ? 'url(#muscleActiveGrad)'
        : hovered
        ? 'rgba(255, 107, 82, 0.45)'
        : 'rgba(255, 255, 255, 0.08)',
      stroke: selected
        ? '#ffffff'
        : hovered
        ? 'var(--primary)'
        : 'rgba(255, 255, 255, 0.22)',
      strokeWidth: selected ? '2.5' : '1.2',
      cursor: 'pointer',
      transition: 'all 0.25s ease-in-out',
      filter: selected ? 'drop-shadow(0 0 8px rgba(255, 107, 82, 0.8))' : 'none',
    };
  };

  return (
    <div style={{
      background: 'rgba(15, 20, 30, 0.65)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Top Header & Switchers */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: '16px'
      }}>
        {/* Gender Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={15} />
            <span>مدل آناتومی:</span>
          </span>
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '3px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              type="button"
              onClick={() => handleGenderToggle('female')}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                border: 'none',
                background: gender === 'female' ? 'var(--primary)' : 'transparent',
                color: gender === 'female' ? '#fff' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              👩 بانوان (زن)
            </button>
            <button
              type="button"
              onClick={() => handleGenderToggle('male')}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                border: 'none',
                background: gender === 'male' ? 'var(--primary)' : 'transparent',
                color: gender === 'male' ? '#fff' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              👨 آقایان (مرد)
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RotateCcw size={15} />
            <span>زاویه دید:</span>
          </span>
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '3px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              type="button"
              onClick={() => setView('front')}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                border: 'none',
                background: view === 'front' ? 'var(--accent)' : 'transparent',
                color: view === 'front' ? '#fff' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              نمای روبرو (جلو)
            </button>
            <button
              type="button"
              onClick={() => setView('back')}
              style={{
                padding: '6px 14px',
                borderRadius: '9px',
                border: 'none',
                background: view === 'back' ? 'var(--accent)' : 'transparent',
                color: view === 'back' ? '#fff' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              نمای پشت (عقب)
            </button>
          </div>
        </div>
      </div>

      {/* Main Body Map Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Left (Visual SVG Diagram) */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.08) 0%, rgba(0,0,0,0.4) 75%)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 10px',
          minHeight: '480px'
        }}>
          {/* Active Hover / Info Banner */}
          <div style={{
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center',
            marginBottom: '8px'
          }}>
            {hoveredMuscle ? (
              <div style={{
                background: 'rgba(255, 107, 82, 0.15)',
                border: '1px solid rgba(255, 107, 82, 0.3)',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                color: '#fff',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                <span>{hoveredMuscle.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '400' }}>
                  ({isSelected(hoveredMuscle.id) ? 'انتخاب شده ✓' : 'برای انتخاب کلیک کنید'})
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={14} />
                <span>روی ماهیچه‌ها نگه دارید یا کلیک کنید</span>
              </span>
            )}
          </div>

          {/* Interactive SVG Diagram */}
          <svg
            viewBox="0 0 320 520"
            style={{ width: '100%', maxWidth: '300px', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              {/* Vibrant Active Gradient */}
              <linearGradient id="muscleActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff8c75" />
                <stop offset="50%" stopColor="#ff6b52" />
                <stop offset="100%" stopColor="#e04830" />
              </linearGradient>

              {/* Body Silhouette Glow Filter */}
              <filter id="bodyGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Neutral Silhouette Outline (Head, Neck, Hands, Feet) */}
            <g style={{ fill: 'rgba(255, 255, 255, 0.03)', stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: '1' }}>
              {/* Head */}
              <ellipse cx="160" cy="40" rx="18" ry="24" />
              {/* Neck */}
              <path d="M152,62 L150,78 L170,78 L168,62 Z" />
              {/* Hands */}
              <path d="M92,246 C86,258 84,274 88,284 C92,286 98,282 102,272 L106,246 Z" />
              <path d="M228,246 C234,258 236,274 232,284 C228,286 222,282 218,272 L214,246 Z" />
              {/* Feet */}
              <path d="M120,470 C112,482 110,496 114,504 C120,506 132,504 138,496 L138,470 Z" />
              <path d="M200,470 C208,482 210,496 206,504 C200,506 188,504 182,496 L182,470 Z" />
            </g>

            {/* FRONT VIEW ANATOMY */}
            {view === 'front' && (
              <g id="front-muscles">
                {/* Traps (Front view collar/neck) */}
                <path
                  d="M148,76 L172,76 L180,90 L140,90 Z"
                  style={getMuscleStyle('traps')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.traps)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('traps')}
                />

                {/* Shoulders / Deltoids (Left & Right) */}
                <path
                  d={gender === 'female'
                    ? "M138,90 C122,92 112,102 110,118 C110,126 118,132 126,128 C132,122 136,108 138,90 Z"
                    : "M136,88 C116,90 102,102 102,120 C102,130 114,136 124,130 C132,124 136,108 136,88 Z"
                  }
                  style={getMuscleStyle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.shoulders)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('shoulders')}
                />
                <path
                  d={gender === 'female'
                    ? "M182,90 C198,92 208,102 210,118 C210,126 202,132 194,128 C188,122 184,108 182,90 Z"
                    : "M184,88 C204,90 218,102 218,120 C218,130 206,136 196,130 C188,124 184,108 184,88 Z"
                  }
                  style={getMuscleStyle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.shoulders)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('shoulders')}
                />

                {/* Chest / Pectorals */}
                <path
                  d={gender === 'female'
                    ? "M158,94 L140,94 C128,102 126,124 130,138 C138,146 152,146 158,142 Z"
                    : "M158,92 L136,92 C122,102 120,128 126,144 C136,152 152,152 158,148 Z"
                  }
                  style={getMuscleStyle('chest')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.chest)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('chest')}
                />
                <path
                  d={gender === 'female'
                    ? "M162,94 L180,94 C192,102 194,124 190,138 C182,146 168,146 162,142 Z"
                    : "M162,92 L184,92 C198,102 200,128 194,144 C184,152 168,152 162,148 Z"
                  }
                  style={getMuscleStyle('chest')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.chest)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('chest')}
                />

                {/* Biceps (Front Left & Right) */}
                <path
                  d="M112,126 C104,136 100,158 106,172 C112,178 120,176 124,168 C128,156 125,136 118,126 Z"
                  style={getMuscleStyle('biceps')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.biceps)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('biceps')}
                />
                <path
                  d="M208,126 C216,136 220,158 214,172 C208,178 200,176 196,168 C192,156 195,136 202,126 Z"
                  style={getMuscleStyle('biceps')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.biceps)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('biceps')}
                />

                {/* Forearms */}
                <path
                  d="M104,176 C96,188 90,218 94,240 C98,246 106,244 112,236 C118,224 118,194 112,176 Z"
                  style={getMuscleStyle('forearms')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.forearms)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('forearms')}
                />
                <path
                  d="M216,176 C224,188 230,218 226,240 C222,246 214,244 208,236 C202,224 202,194 208,176 Z"
                  style={getMuscleStyle('forearms')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.forearms)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('forearms')}
                />

                {/* Abs (Six-Pack Core) */}
                <g
                  style={getMuscleStyle('abs')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.abs)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('abs')}
                >
                  {/* Upper Abs */}
                  <rect x="146" y="148" width="12" height="18" rx="3" />
                  <rect x="162" y="148" width="12" height="18" rx="3" />
                  {/* Mid Abs */}
                  <rect x="146" y="170" width="12" height="20" rx="3" />
                  <rect x="162" y="170" width="12" height="20" rx="3" />
                  {/* Lower Abs */}
                  <path d="M146,194 L158,194 L156,224 L148,220 Z" />
                  <path d="M162,194 L174,194 L172,220 L164,224 Z" />
                </g>

                {/* Obliques (Sides of waist) */}
                <path
                  d={gender === 'female'
                    ? "M130,146 C136,164 136,200 142,222 C134,224 126,214 122,190 C120,170 124,154 130,146 Z"
                    : "M128,150 C136,168 136,204 142,226 C132,228 124,216 120,192 C118,172 122,158 128,150 Z"
                  }
                  style={getMuscleStyle('obliques')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.obliques)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('obliques')}
                />
                <path
                  d={gender === 'female'
                    ? "M190,146 C184,164 184,200 178,222 C186,224 194,214 198,190 C200,170 196,154 190,146 Z"
                    : "M192,150 C184,168 184,204 178,226 C188,228 196,216 200,192 C202,172 198,158 192,150 Z"
                  }
                  style={getMuscleStyle('obliques')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.obliques)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('obliques')}
                />

                {/* Quads (Front Thighs) */}
                <path
                  d={gender === 'female'
                    ? "M134,236 C116,252 112,298 116,344 C120,364 132,372 138,372 C144,372 150,356 152,334 C154,300 152,258 144,236 Z"
                    : "M136,234 C114,250 110,298 114,348 C118,368 130,376 138,376 C144,376 150,360 152,336 C154,300 152,256 144,234 Z"
                  }
                  style={getMuscleStyle('quads')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.quads)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('quads')}
                />
                <path
                  d={gender === 'female'
                    ? "M186,236 C204,252 208,298 204,344 C200,364 188,372 182,372 C176,372 170,356 168,334 C166,300 168,258 176,236 Z"
                    : "M184,234 C206,250 210,298 206,348 C202,368 190,376 182,376 C176,376 170,360 168,336 C166,300 168,256 176,234 Z"
                  }
                  style={getMuscleStyle('quads')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.quads)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('quads')}
                />

                {/* Calves (Front Shin / Calves) */}
                <path
                  d="M124,394 C116,410 116,440 122,466 C128,472 136,470 140,464 C144,450 142,420 138,394 Z"
                  style={getMuscleStyle('calves')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.calves)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('calves')}
                />
                <path
                  d="M196,394 C204,410 204,440 198,466 C192,472 184,470 180,464 C176,450 178,420 182,394 Z"
                  style={getMuscleStyle('calves')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.calves)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('calves')}
                />
              </g>
            )}

            {/* BACK VIEW ANATOMY */}
            {view === 'back' && (
              <g id="back-muscles">
                {/* Traps (Trapezius upper back) */}
                <path
                  d="M160,74 L142,88 L140,108 L160,140 L180,108 L178,88 Z"
                  style={getMuscleStyle('traps')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.traps)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('traps')}
                />

                {/* Rear Delts / Shoulders */}
                <path
                  d={gender === 'female'
                    ? "M136,90 C120,94 110,104 108,120 C114,128 124,128 130,120 C134,110 136,100 136,90 Z"
                    : "M134,88 C116,92 104,104 102,122 C110,130 122,130 130,122 C134,110 134,100 134,88 Z"
                  }
                  style={getMuscleStyle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.shoulders)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('shoulders')}
                />
                <path
                  d={gender === 'female'
                    ? "M184,90 C200,94 210,104 212,120 C206,128 196,128 190,120 C186,110 184,100 184,90 Z"
                    : "M186,88 C204,92 216,104 218,122 C210,130 198,130 190,122 C186,110 186,100 186,88 Z"
                  }
                  style={getMuscleStyle('shoulders')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.shoulders)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('shoulders')}
                />

                {/* Triceps (Back of Arms) */}
                <path
                  d="M112,124 C104,134 102,158 108,172 C114,178 122,174 126,166 C128,154 126,134 118,124 Z"
                  style={getMuscleStyle('triceps')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.triceps)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('triceps')}
                />
                <path
                  d="M208,124 C216,134 218,158 212,172 C206,178 198,174 194,166 C192,154 194,134 202,124 Z"
                  style={getMuscleStyle('triceps')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.triceps)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('triceps')}
                />

                {/* Lats (Latissimus Dorsi / Wings) */}
                <path
                  d={gender === 'female'
                    ? "M156,122 L138,112 C126,126 124,154 130,182 C138,186 150,184 154,178 Z"
                    : "M156,120 L134,108 C120,124 118,156 126,186 C136,190 150,188 154,180 Z"
                  }
                  style={getMuscleStyle('lats')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.lats)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('lats')}
                />
                <path
                  d={gender === 'female'
                    ? "M164,122 L182,112 C194,126 196,154 190,182 C182,186 170,184 166,178 Z"
                    : "M164,120 L186,108 C200,124 202,156 194,186 C184,190 170,188 166,180 Z"
                  }
                  style={getMuscleStyle('lats')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.lats)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('lats')}
                />

                {/* Lower Back (Erector Spinae / فیله کمر) */}
                <path
                  d="M148,186 L172,186 L170,224 L150,224 Z"
                  style={getMuscleStyle('lower_back')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.lower_back)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('lower_back')}
                />

                {/* Glutes (عضلات باسن و سرینی) */}
                <path
                  d={gender === 'female'
                    ? "M158,226 C134,226 112,242 110,268 C110,292 132,306 156,302 C158,284 158,250 158,226 Z"
                    : "M158,226 C138,226 120,240 118,264 C118,286 136,298 156,296 C158,280 158,250 158,226 Z"
                  }
                  style={getMuscleStyle('glutes')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.glutes)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('glutes')}
                />
                <path
                  d={gender === 'female'
                    ? "M162,226 C186,226 208,242 210,268 C210,292 188,306 164,302 C162,284 162,250 162,226 Z"
                    : "M162,226 C182,226 200,240 202,264 C202,286 184,298 164,296 C162,280 162,250 162,226 Z"
                  }
                  style={getMuscleStyle('glutes')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.glutes)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('glutes')}
                />

                {/* Hamstrings (پشت ران) */}
                <path
                  d="M120,306 C116,328 118,358 124,376 C132,380 142,378 148,372 C152,352 152,324 148,306 Z"
                  style={getMuscleStyle('hamstrings')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.hamstrings)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('hamstrings')}
                />
                <path
                  d="M200,306 C204,328 202,358 196,376 C188,380 178,378 172,372 C168,352 168,324 172,306 Z"
                  style={getMuscleStyle('hamstrings')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.hamstrings)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('hamstrings')}
                />

                {/* Calves (پشت ساق پا) */}
                <path
                  d="M122,394 C114,412 114,442 120,468 C126,474 136,472 140,464 C144,450 142,420 138,394 Z"
                  style={getMuscleStyle('calves')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.calves)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('calves')}
                />
                <path
                  d="M198,394 C206,412 206,442 200,468 C194,474 184,472 180,464 C176,450 178,420 182,394 Z"
                  style={getMuscleStyle('calves')}
                  onMouseEnter={() => setHoveredMuscle(MUSCLES.calves)}
                  onMouseLeave={() => setHoveredMuscle(null)}
                  onClick={() => toggleMuscle('calves')}
                />
              </g>
            )}
          </svg>
        </div>

        {/* Right (Selection Chips, Quick Groups, and Details) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick Categories Bar */}
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              انتخاب سریع بر اساس بخش بدن:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => selectCategory('lower')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                🍑 عضلات پایین‌تنه (باسن و ران)
              </button>
              <button
                type="button"
                onClick={() => selectCategory('core')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                🔥 میان‌تنه و شکم
              </button>
              <button
                type="button"
                onClick={() => selectCategory('upper')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                💪 بالاتنه (سینه، سرشانه و دست)
              </button>
              {selectedMuscles.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    padding: '6px 8px'
                  }}
                >
                  پاک کردن همه
                </button>
              )}
            </div>
          </div>

          {/* Muscle List Chips by Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Lower Body */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)', display: 'block', marginBottom: '6px' }}>
                پایین‌تنه:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {MUSCLE_LIST.filter(m => m.category === 'lower').map(muscle => {
                  const active = isSelected(muscle.id);
                  return (
                    <button
                      key={muscle.id}
                      type="button"
                      onClick={() => toggleMuscle(muscle.id)}
                      onMouseEnter={() => setHoveredMuscle(muscle)}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                        background: active ? 'rgba(255, 107, 82, 0.2)' : 'rgba(0,0,0,0.2)',
                        color: active ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: active ? '700' : '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'var(--transition)'
                      }}
                    >
                      {active ? <Check size={13} style={{ color: 'var(--primary)' }} /> : null}
                      <span>{muscle.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)', display: 'block', marginBottom: '6px' }}>
                شکم و میان‌تنه:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {MUSCLE_LIST.filter(m => m.category === 'core').map(muscle => {
                  const active = isSelected(muscle.id);
                  return (
                    <button
                      key={muscle.id}
                      type="button"
                      onClick={() => toggleMuscle(muscle.id)}
                      onMouseEnter={() => setHoveredMuscle(muscle)}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                        background: active ? 'rgba(255, 107, 82, 0.2)' : 'rgba(0,0,0,0.2)',
                        color: active ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: active ? '700' : '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'var(--transition)'
                      }}
                    >
                      {active ? <Check size={13} style={{ color: 'var(--primary)' }} /> : null}
                      <span>{muscle.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upper Body */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--secondary)', display: 'block', marginBottom: '6px' }}>
                بالاتنه و دست‌ها:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {MUSCLE_LIST.filter(m => m.category === 'upper').map(muscle => {
                  const active = isSelected(muscle.id);
                  return (
                    <button
                      key={muscle.id}
                      type="button"
                      onClick={() => toggleMuscle(muscle.id)}
                      onMouseEnter={() => setHoveredMuscle(muscle)}
                      onMouseLeave={() => setHoveredMuscle(null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                        background: active ? 'rgba(255, 107, 82, 0.2)' : 'rgba(0,0,0,0.2)',
                        color: active ? '#ffffff' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: active ? '700' : '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'var(--transition)'
                      }}
                    >
                      {active ? <Check size={13} style={{ color: 'var(--primary)' }} /> : null}
                      <span>{muscle.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Selection Counter & Badges */}
          <div style={{
            background: 'rgba(255, 107, 82, 0.05)',
            border: '1px solid rgba(255, 107, 82, 0.15)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>
                <Layers size={16} />
                <span>عضلات انتخاب شده برای تقویت ({selectedMuscles.length}):</span>
              </div>
            </div>

            {selectedMuscles.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                هیچ عضله‌ای انتخاب نشده است. با کلیک بر روی اندام‌های بالا یا برچسب‌ها، عضلاتی که مایلید برنامه ورزشی روی آن‌ها تمرکز داشته باشد را مشخص کنید.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedMuscles.map(id => {
                  const m = MUSCLES[id];
                  return (
                    <span
                      key={id}
                      style={{
                        background: 'rgba(255, 107, 82, 0.15)',
                        border: '1px solid rgba(255, 107, 82, 0.3)',
                        color: '#ff8c75',
                        fontSize: '0.75rem',
                        padding: '3px 10px',
                        borderRadius: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{m ? m.name : id}</span>
                      <button
                        type="button"
                        onClick={() => toggleMuscle(id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff8c75',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '0.9rem',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
