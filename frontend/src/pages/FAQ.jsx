import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  ChevronDown, 
  Sparkles, 
  Terminal, 
  ArrowRight,
  Code,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const instructions = [
    {
      title: 'Step 1: Field Registration Process',
      desc: 'Complete the registration form with your authentic College Roll and University Registration numbers. Select your interested field such as: UI/UX DESIGNER, DEVELOPER, DOCUMANTARY, RESEARCH, IOT, or MARKETING.'
    },
    {
      title: 'Step 2: Auto-Generation of 1-Year Membership ID',
      desc: 'Upon form submission, the system generates a unique annual Membership ID (Format: CCXX-DEPT-XXX, e.g. CC26-DEV-123) stored alongside your cryptographically hashed password.'
    },
    {
      title: 'Step 3: Accessing the Two-Part Digital Card',
      desc: 'Head to your Member Dashboard to view Part 1 (Photo Identity & Club Designation) and Part 2 (Academic Roll Records & Verification QR).'
    },
    {
      title: 'Step 4: Project Contribution',
      desc: 'Join real-world project initiatives using project codes like PR-XXX and submit your contributions via GitHub pull requests or internal documentation commits.'
    }
  ];

  const rules = [
    {
      rule: 'Credential Authenticity',
      text: 'Members must provide authentic University Roll and College Roll information. Falsification triggers immediate account demotion and administrative disciplinary notice.'
    },
    {
      rule: 'Project Code Standards (e.g. PR-XXX)',
      text: 'All GitHub pull requests and internal documentation commits must be signed by the corresponding Team Lead of the CC project code in the commit header.'
    },
    {
      rule: 'Attendance Quorum for Hackathons',
      text: 'Maintaining at least 75% active sprint attendance on the Attendance Hub is required to represent Team CC at college level hackathons.'
    },
    {
      rule: 'Administrative Governance',
      text: 'Lead Admins and Core Leads reserve the right to promote or demote members based on team contributions and attendance metrics.'
    }
  ];

  const faqs = [
    {
      q: 'How long is the generated Membership ID valid for?',
      a: 'Each newly generated ID is valid for exactly 1 full calendar year (365 days) from the registration date. You can check your expiration countdown inside the Member Dashboard.'
    },
    {
      q: 'What is the difference between Part 1 and Part 2 of the Membership Card?',
      a: 'Part 1 focuses on your Club Identity, including your photo avatar, Department badge, Member ID, and club role. Part 2 houses your verified academic records (Year, Semester, College Roll, University Roll Number, and Security Verification Hash).'
    },
    
    {
      q: 'Can I update my Semester after onboarding?',
      a: 'Yes, members can update their academic year and semester via the Member Dashboard or by requesting an administrative record sync.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" /> Documentation & Governance
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Guidelines, Rules & How-to-Use
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Comprehensive blueprint documentation, onboarding instructions, use-case demonstrations, and official community guidelines.
        </p>
      </div>

      {/* 1. INTERACTIVE USE-CASE DEMO WALKTHROUGH */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Use-Case Flow Diagram</h2>
              <p className="text-xs text-gray-400">Step-by-step lifecycle from registration to project delivery</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
            WORKFLOW v-0.8
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {instructions.map((step, idx) => (
            <div key={idx} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800/90 space-y-2 relative">
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                PHASE 0{idx + 1}
              </span>
              <h3 className="text-sm font-bold text-white">{step.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. OFFICIAL SYSTEM RULES */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" /> Official Club Code & System Rules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rules.map((r, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <h3 className="text-sm font-bold text-white">{r.rule}</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FREQUENTLY ASKED QUESTIONS ACCORDION */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" /> Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-cyan-300 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    openIndex === idx ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {openIndex === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-gray-300 leading-relaxed border-t border-slate-800/60 bg-slate-900/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FAQ;
