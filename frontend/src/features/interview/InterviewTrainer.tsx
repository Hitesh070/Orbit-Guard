/**
 * OrbitGuard ISRO & HAL Technical Interview Trainer (Phase 6 & Part 2)
 * =====================================================================
 * An interactive simulation trainer designed for Electrical & Electronics Engineering
 * candidates preparing for ISRO Scientist/Engineer 'SC' and HAL Design Trainee panels.
 *
 * Covers:
 * - Module 1: Celestial Reference Frames (TEME/ECEF), SGP4 Perturbations & Decay
 * - Module 2: Conjunction Assessment, Foster 1992 Encounter Plane, Akella Pc,max
 * - Module 3: Topocentric RF, Diurnal Doppler Compensation (v_obs), Uplink Pre-compensation
 * - Module 4: Parabolic Link Budgets, Boltzmann Constant (+228.6 origin), Pointing Loss
 * - Module 5: Az/El Antenna Tracking, Zenith Keyhole Singularity, TMC2209 Kinematics & EMI
 */

import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface Question {
  id: string;
  category: 'Astrodynamics' | 'Conjunction Pc' | 'RF & Doppler' | 'Rotator & Embedded';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  interviewTip: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'astro-1',
    category: 'Astrodynamics',
    question: 'Why does SGP4 propagate orbits in the True Equator, Mean Equinox (TEME) frame instead of the standard J2000 ECI frame?',
    options: [
      'TEME accounts for relativistic spacetime curvature in Low Earth Orbit.',
      'SGP4 analytical equations were formulated directly in TEME to avoid calculating nutation and precession, reducing computational burden for real-time tracking.',
      'J2000 is an Earth-Centered Earth-Fixed (ECEF) frame, so it cannot represent elliptical satellite orbits.',
      'TEME is aligned with the prime meridian, eliminating the need for sidereal time rotations.',
    ],
    correctIndex: 1,
    explanation:
      'SGP4 was specifically developed to track thousands of objects under strict compute limits. Its analytical equations bypass Earth precession and nutation corrections by propagating directly in the TEME frame of date. To transform to ECEF, one performs a simple rotation around the celestial z-axis by Greenwich Mean Sidereal Time: r_ECEF = R_z(GMST) · r_TEME.',
    interviewTip: 'Interviewers test whether you understand why Earth rotation cannot simply be ignored and whether you know the difference between TEME and J2000.',
  },
  {
    id: 'astro-2',
    category: 'Astrodynamics',
    question: 'What is the physical meaning and unit of the B* (BSTAR) drag term present in standard two-line element sets (TLEs)?',
    options: [
      'Solar radiation pressure coefficient in Pascals per square meter.',
      'Orbital decay rate measured in kilometers per second squared.',
      'An empirical drag parameter equal to (1/2) * (Cd * A / m) * rho_0 in units of inverse Earth radii (1/R_E).',
      'The spacecraft magnetic dipole moment used for attitude detumbling.',
    ],
    correctIndex: 2,
    explanation:
      'B* combines the aerodynamic ballistic coefficient (m / (Cd * A)) with a reference atmospheric density rho_0: B* = (rho_0 * B) / 2 = (rho_0 * Cd * A) / (2 * m). It has units of (Earth radii)^(-1) and is treated as a fitting parameter absorbing short-term density fluctuations.',
    interviewTip: 'Emphasize that B* is a fitted parameter over the observation window, which is why propagating with old TLEs degrades accuracy rapidly in LEO.',
  },
  {
    id: 'conj-1',
    category: 'Conjunction Pc',
    question: 'Why is it possible for a conjunction with a small miss distance (e.g. 150 meters) to have a lower collision probability (Pc) than one with a 1.5 km miss distance?',
    options: [
      'The smaller object undergoes greater gravitational repulsion near TCA.',
      'Gauss-Legendre integration fails when distance is below 500 meters.',
      'If the covariance ellipsoid is immense, the probability density spreads over hundreds of kilometers, diluting peak density over the hard-body circle.',
      'The Foster-1992 encounter plane only evaluates radial components.',
    ],
    correctIndex: 2,
    explanation:
      'Collision probability integrates the 2D Gaussian density function over the hard-body circle: Pc = (1 / (2*pi*sqrt(det C))) * integral[exp(-0.5 * r^T * C^-1 * r)]. When uncertainty sigma -> infinity, the normalization factor 1/sqrt(det C) drives Pc -> 0, despite a zero miss distance. This is why Akella-Alfriend maximum Pc (Pc,max) evaluates scaled covariance.',
    interviewTip: 'This is the classic "Probability Dilution Paradox." Explaining this proves you understand collision risk beyond high-school geometry.',
  },
  {
    id: 'conj-2',
    category: 'Conjunction Pc',
    question: 'What key assumption of the Foster-1992 2-D encounter plane breaks down during low relative-velocity encounters (v_rel < 10 m/s)?',
    options: [
      'Earth’s magnetic field induces eddy currents on the spacecraft.',
      'The rectilinear relative motion assumption: during low v_rel, relative trajectories are curved (curvilinear) over the encounter duration.',
      'Gauss-Legendre quadrature cannot be computed for non-circular orbits.',
      'The hard-body sphere assumption ceases to be conservative.',
    ],
    correctIndex: 1,
    explanation:
      'Foster-1992 assumes the encounter duration is negligible compared to the orbital period (short encounter) and relative motion is a straight line. When v_rel < 10 m/s (e.g. co-orbital satellites or GEO stationkeeping), the interaction lasts hours and curvature becomes significant, requiring 3-D curvilinear Monte Carlo or Chan’s method.',
    interviewTip: 'Mentioning co-located GEO communication satellites (such as GSATs at ISRO) immediately signals operational situational awareness.',
  },
  {
    id: 'rf-1',
    category: 'RF & Doppler',
    question: 'Why must the ground station observer’s diurnal tangential velocity v_obs = [-omega_E * y, omega_E * x, 0]^T be included in topocentric Doppler calculations?',
    options: [
      'To account for ionospheric scintillation delay on the radio carrier.',
      'Earth rotation creates a surface tangential speed of up to 465 m/s at the equator, causing hundreds of Hertz of line-of-sight Doppler error if ignored.',
      'To synchronize the UTC timestamp with the spacecraft’s onboard atomic clock.',
      'It prevents phase inversion in right-hand circular polarization (RHCP).',
    ],
    correctIndex: 1,
    explanation:
      'At latitude phi, surface speed is v_obs = omega_E * R_E * cos(phi). At the equator (phi = 0°), this is 465.1 m/s. The true range rate is dot(rho) = dot(r_sat - r_obs, v_sat - v_obs) / |r_sat - r_obs|. Neglecting v_obs introduces up to 465 m/s error, which at UHF (437 MHz) causes ~680 Hz error, throwing the receiver out of its tracking bandwidth.',
    interviewTip: 'Derive v_obs as the cross product omega_E x r_obs. State that 465 m/s is ~6% of LEO velocity (7.7 km/s)—too large to neglect!',
  },
  {
    id: 'rf-2',
    category: 'RF & Doppler',
    question: 'What is the correct mathematical convention for ground station uplink Doppler pre-compensation for a satellite receiving at f_0?',
    options: [
      'f_tx = f_0 * (1 - dot(rho) / c)',
      'f_tx = f_0 / (1 - dot(rho) / c) ≈ f_0 * (1 + dot(rho) / c)',
      'f_tx = f_0 + 20 * log10(dot(rho))',
      'f_tx = f_0 * sqrt(1 - (v / c)^2)',
    ],
    correctIndex: 1,
    explanation:
      'For range rate dot(rho) defined positive when receding: the satellite receives f_rx = f_tx * (1 - dot(rho) / c). To ensure f_rx = f_0 exactly, the ground station must transmit f_tx = f_0 / (1 - dot(rho) / c). When approaching (dot(rho) < 0), f_tx is pre-shifted lower than nominal f_0.',
    interviewTip: 'Highlight the sign convention clearly: receding is positive range rate, so uplink pre-compensation is the inverse of downlink reception.',
  },
  {
    id: 'rf-3',
    category: 'RF & Doppler',
    question: 'Where does the constant +228.6 dB in the standard carrier-to-noise density (C/N0) link equation come from?',
    options: [
      'It is the speed of light in dB km/s: 10 * log10(299792).',
      'It is -10 * log10(k_B), where k_B is Boltzmann’s constant (1.380649e-23 J/K).',
      'It represents the free-space impedance of vacuum (120*pi = 377 ohms).',
      'It is the conversion factor between Kelvins and degrees Celsius.',
    ],
    correctIndex: 1,
    explanation:
      'Thermal noise spectral density is N_0 = k_B * T [W/Hz]. In decibels: N_0 [dBW/Hz] = 10*log10(k_B) + 10*log10(T). Since 10*log10(1.380649e-23) = -228.6 dB(W/(K·Hz)), subtracting N_0 adds +228.6: C/N0 = EIRP - Losses + G/T + 228.6.',
    interviewTip: 'Every ISRO/HAL communications interviewer expects candidates to write N_0 = k_B * T from memory and derive 228.6 on the whiteboard.',
  },
  {
    id: 'rot-1',
    category: 'Rotator & Embedded',
    question: 'How does OrbitGuard’s antenna controller resolve the "zenith keyhole singularity" when tracking a satellite pass with 88° maximum elevation?',
    options: [
      'It cuts motor power completely to let aerodynamic drag decelerate the mast.',
      'It commands the satellite to pitch its transponder downward toward the horizon.',
      'It detects elevation > 85° and executes either "flip-mode" (tilting elevation through 90°–180°) or clamps the azimuth slew rate to avoid motor stall.',
      'It switches from stepper control to open-loop manual joystick control.',
    ],
    correctIndex: 2,
    explanation:
      'For an overhead pass, azimuth must swing 180° near TCA in a matter of seconds. Standard rotators cannot slew at 50°/s. OrbitGuard supports elevation flip mode (0–180° elevation range with 180° azimuth offset) or clamps the azimuth tracking rate during the 60 seconds around zenith.',
    interviewTip: 'Describe keyhole singularity as a coordinate singularity of the topocentric spherical coordinate system (r, az, el) at elevation = 90°.',
  },
  {
    id: 'rot-2',
    category: 'Rotator & Embedded',
    question: 'For a dual-axis rotator with 1.8°/step hybrid steppers, 1/16 microstepping, and a 60:1 worm gearbox, what is the exact kinematic steps-per-degree ratio?',
    options: [
      '200.0000 steps/deg',
      '360.0000 steps/deg',
      '533.3333 steps/deg',
      '1920.0000 steps/deg',
    ],
    correctIndex: 2,
    explanation:
      '1.8° per step -> 200 full steps per revolution. With 16 microsteps, motor steps per rev = 200 * 16 = 3,200 microsteps. Through a 60:1 worm gear, total output steps per 360° = 3,200 * 60 = 192,000 steps. Therefore: 192,000 / 360 = 533.3333 steps/deg.',
    interviewTip: 'Always write down the kinematic formula clearly: Steps/Deg = (Steps_rev * Microsteps * GearRatio) / 360.',
  },
  {
    id: 'rot-3',
    category: 'Rotator & Embedded',
    question: 'Why are worm gearboxes specifically preferred over standard spur or planetary gearboxes in outdoor satellite ground station antenna positioners?',
    options: [
      'Worm gears have 99% mechanical transmission efficiency.',
      'Worm gears provide mechanical self-locking, preventing high wind loads on large parabolic or Yagi antennas from backdriving the motors when stationary or unpowered.',
      'Worm gears eliminate all electrical noise from stepper driver PWM.',
      'Worm gears allow 360° continuous rotation without slip rings.',
    ],
    correctIndex: 1,
    explanation:
      'Wind acting on an antenna array creates immense aerodynamic torque. Spur and planetary gears have high reverse backdrivability, forcing motors to draw continuous hold current. Worm gears have a low lead angle that prevents backdriving (mechanical self-locking), holding position safely even under power loss.',
    interviewTip: 'Connect this to electronics: self-locking allows reducing stepper holding current to 20%, drastically decreasing coil heating and power consumption.',
  },
];

const FORMULAS = [
  {
    domain: 'Coordinate Frames',
    name: 'TEME to ECEF Transformation',
    formula: 'r_ECEF = R_z(GMST) · r_TEME',
    notes: 'Greenwich Mean Sidereal Time rotation around celestial z-axis. Nutation and polar motion neglected in screening.',
  },
  {
    domain: 'RF Doppler',
    name: 'Topocentric Range Rate (with Earth Velocity)',
    formula: 'dot(rho) = [(r_sat - r_obs) · (v_sat - v_obs)] / ||r_sat - r_obs||',
    notes: 'v_obs = [-omega_E * y_obs, omega_E * x_obs, 0]^T. Equatorial v_obs ≈ 465.1 m/s.',
  },
  {
    domain: 'RF Doppler',
    name: 'Downlink Doppler & Uplink Pre-compensation',
    formula: 'Δf = -f_0 · (dot(rho) / c)  |  f_tx = f_0 / (1 - dot(rho) / c)',
    notes: 'Positive dot(rho) = satellite receding. Relativistic (v/c)^2 ≈ 10^-9 neglected.',
  },
  {
    domain: 'Conjunction Assessment',
    name: 'Foster-1992 Encounter Plane Collision Probability',
    formula: 'P_c = (1 / 2π√det(C_2D)) ∬ exp(-0.5 (r - m)^T C_2D^-1 (r - m)) d^2r',
    notes: 'Integrated over hard-body disk Disk(R_HBR) via 64-point Gauss-Legendre quadrature.',
  },
  {
    domain: 'Conjunction Assessment',
    name: 'Akella-Alfriend Maximum Pc Bound',
    formula: 'P_c,max = max_{k > 0} P_c(m, k · C_2D)',
    notes: 'Evaluates worst-case covariance scale factor k to guard against probability dilution.',
  },
  {
    domain: 'Link Budget',
    name: 'Free Space Path Loss (FSPL)',
    formula: 'FSPL (dB) = 20 log10(d_km) + 20 log10(f_MHz) + 32.44',
    notes: 'Doubling distance or frequency adds +6.02 dB loss. Derived from (4πd/λ)^2.',
  },
  {
    domain: 'Link Budget',
    name: 'Carrier-to-Noise Density (C/N0)',
    formula: 'C/N0 = EIRP - FSPL - L_atm - L_point + (G/T) + 228.6',
    notes: '+228.6 dB = -10 log10(k_B) where k_B = 1.380649 × 10^-23 J/K.',
  },
  {
    domain: 'Embedded Firmware',
    name: 'Kinematic Stepper Drive Ratio',
    formula: 'Steps/Deg = (N_steps · μ · G_ratio) / 360',
    notes: '200 steps · 16 microsteps · 60:1 gear / 360° = 533.3333 steps/deg.',
  },
];

interface InterviewTrainerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterviewTrainer: React.FC<InterviewTrainerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'formulas'>('quiz');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);

  if (!isOpen) return null;

  const filteredQuestions =
    selectedCategory === 'All'
      ? QUESTIONS
      : QUESTIONS.filter((q) => q.category === selectedCategory);

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0];
  const selectedOption = selectedAnswers[currentQ.id];
  const hasAnswered = selectedOption !== undefined;
  const isCorrect = hasAnswered && selectedOption === currentQ.correctIndex;

  // Calculate score
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = Object.entries(selectedAnswers).reduce((acc, [qid, optIdx]) => {
    const q = QUESTIONS.find((item) => item.id === qid);
    return q && q.correctIndex === optIdx ? acc + 1 : acc;
  }, 0);

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: idx }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(selectedAnswers[filteredQuestions[currentIndex + 1]?.id] !== undefined);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowExplanation(selectedAnswers[filteredQuestions[currentIndex - 1]?.id] !== undefined);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-space-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-space-950 border border-cyan-500/30 rounded-2xl p-5 md:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="OrbitGuard ISRO & HAL Interview Trainer"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-space-950 font-black shadow-glow-cyan">
              <GraduationCap className="w-6 h-6 text-space-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                  ISRO & HAL Technical Interview Simulator
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Scientist 'SC' Prep
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Astrodynamics, Conjunction Math, EEE/RF Ground Stations & Embedded Kinematics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Close Trainer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Category Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 my-3">
          <div className="flex items-center gap-1 bg-space-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'quiz'
                  ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Interactive Defense Quiz
            </button>
            <button
              onClick={() => setActiveTab('formulas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'formulas'
                  ? 'bg-cyan-500 text-space-950 font-bold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Formula Cheat Sheet
            </button>
          </div>

          {activeTab === 'quiz' && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-space-900 border border-slate-800">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Score:</span>
                <span className="text-emerald-400 font-bold">
                  {score} / {answeredCount}
                </span>
                <span className="text-slate-500">({filteredQuestions.length} total)</span>
              </div>
              <button
                onClick={handleResetQuiz}
                title="Reset Quiz Progress"
                className="p-1.5 rounded-lg bg-space-900 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Quiz Body */}
        {activeTab === 'quiz' ? (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
              {['All', 'Astrodynamics', 'Conjunction Pc', 'RF & Doppler', 'Rotator & Embedded'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentIndex(0);
                    setShowExplanation(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-space-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Current Question Card */}
            <div className="bg-space-900/90 border border-cyan-500/30 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="text-cyan-400 font-bold uppercase tracking-wide">
                  [{currentQ.category}] Question {currentIndex + 1} of {filteredQuestions.length}
                </span>
                {hasAnswered && (
                  <span
                    className={`flex items-center gap-1 font-bold ${
                      isCorrect ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {isCorrect ? 'Correct (+1)' : 'Incorrect'}
                  </span>
                )}
              </div>

              <h2 className="text-sm md:text-base font-semibold text-slate-100 leading-relaxed">
                {currentQ.question}
              </h2>

              {/* Options Grid */}
              <div className="mt-4 space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  let btnStyle = 'bg-space-950/80 border-slate-800 hover:border-cyan-500/50 text-slate-200';
                  if (hasAnswered) {
                    if (idx === currentQ.correctIndex) {
                      btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold shadow-glow-emerald';
                    } else if (idx === selectedOption) {
                      btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-300 font-bold';
                    } else {
                      btnStyle = 'bg-space-950/40 border-slate-900 text-slate-600 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-3 rounded-xl border text-xs md:text-sm font-sans flex items-start gap-3 transition ${btnStyle}`}
                    >
                      <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs shrink-0 font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Technical Explanation Box */}
              {showExplanation && (
                <div className="mt-4 p-3.5 rounded-xl bg-space-950 border border-slate-800 space-y-2.5 animate-in fade-in duration-200 text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Engineering Physics & Derivation
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">{currentQ.explanation}</p>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300 font-sans flex items-start gap-1.5">
                    <span className="font-bold text-amber-400 shrink-0">ISRO/HAL Panel Focus:</span>
                    <span>{currentQ.interviewTip}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-300 disabled:opacity-40 text-xs font-mono transition"
              >
                ← Previous
              </button>

              <span className="text-xs font-mono text-slate-500">
                {currentIndex + 1} / {filteredQuestions.length}
              </span>

              <button
                onClick={handleNext}
                disabled={currentIndex === filteredQuestions.length - 1}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono shadow-glow-cyan disabled:opacity-40 transition flex items-center gap-1.5"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Formula Cheat Sheet Body */
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="text-xs text-slate-400 font-sans">
              Critical formulas, physical assumptions, and reference constants for whiteboard defense:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FORMULAS.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-space-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                        {item.domain}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-200">{item.name}</h3>
                    <div className="my-2 p-2 rounded-lg bg-space-950 border border-cyan-500/20 font-mono text-xs text-emerald-300 font-bold overflow-x-auto">
                      {item.formula}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans border-t border-slate-800/80 pt-1.5">
                    {item.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewTrainer;
