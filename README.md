<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" width="900" height="420">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&amp;family=Space+Grotesk:wght@400;500;600&amp;display=swap');

      .logo { font-family: 'Syne', 'Arial Black', sans-serif; font-weight: 800; font-size: 78px; }
      .sub  { font-family: 'Space Grotesk', Arial, sans-serif; font-size: 16px; font-weight: 500; fill: rgba(196,181,253,0.8); letter-spacing: 1px; }
      .badge-text { font-family: 'Space Grotesk', Arial, sans-serif; font-size: 11px; font-weight: 600; fill: #fff; }
      .pill-text  { font-family: 'Space Grotesk', Arial, sans-serif; font-size: 12px; font-weight: 600; }
      .stat-num   { font-family: 'Syne', 'Arial Black', sans-serif; font-weight: 800; font-size: 28px; fill: #fff; }
      .stat-label { font-family: 'Space Grotesk', Arial, sans-serif; font-size: 10px; fill: rgba(255,255,255,0.45); letter-spacing: 0.5px; }

      /* Fade-in animation */
      .fadein { animation: fadein 1.2s ease both; }
      .fadein-d1 { animation: fadein 1.2s 0.3s ease both; }
      .fadein-d2 { animation: fadein 1.2s 0.6s ease both; }
      .fadein-d3 { animation: fadein 1.2s 0.9s ease both; }
      .fadein-d4 { animation: fadein 1.2s 1.1s ease both; }
      .fadein-d5 { animation: fadein 1.2s 1.3s ease both; }
      @keyframes fadein { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }

      /* Gradient text shimmer */
      .shimmer { animation: shimmer 4s linear infinite; }
      @keyframes shimmer { 0%,100% { fill: url(#logoGrad1); } 50% { fill: url(#logoGrad2); } }

      /* Floating sparkles */
      .sp1 { animation: spark 3.2s 0s ease-in-out infinite; }
      .sp2 { animation: spark 4.1s 0.8s ease-in-out infinite; }
      .sp3 { animation: spark 2.9s 1.5s ease-in-out infinite; }
      .sp4 { animation: spark 3.7s 0.4s ease-in-out infinite; }
      .sp5 { animation: spark 4.5s 2s ease-in-out infinite; }
      .sp6 { animation: spark 2.8s 1.2s ease-in-out infinite; }
      .sp7 { animation: spark 3.4s 2.5s ease-in-out infinite; }
      .sp8 { animation: spark 4.0s 0.6s ease-in-out infinite; }
      .sp9 { animation: spark 3.1s 3.0s ease-in-out infinite; }
      .sp10 { animation: spark 4.8s 1.8s ease-in-out infinite; }
      .sp11 { animation: spark 3.6s 0.2s ease-in-out infinite; }
      .sp12 { animation: spark 2.6s 2.2s ease-in-out infinite; }
      @keyframes spark {
        0%,100% { opacity: 0; transform: scale(0) rotate(0deg); }
        40%,60% { opacity: 1; transform: scale(1) rotate(180deg); }
      }

      /* Floating dots */
      .dot1 { animation: floatdot 6s 0s ease-in-out infinite; }
      .dot2 { animation: floatdot 8s 2s ease-in-out infinite; }
      .dot3 { animation: floatdot 7s 1s ease-in-out infinite; }
      .dot4 { animation: floatdot 9s 3s ease-in-out infinite; }
      .dot5 { animation: floatdot 6.5s 4s ease-in-out infinite; }
      .dot6 { animation: floatdot 7.5s 1.5s ease-in-out infinite; }
      @keyframes floatdot {
        0%,100% { transform: translateY(0); opacity: 0.3; }
        50% { transform: translateY(-12px); opacity: 0.7; }
      }

      /* Pulse ring */
      .pulse { animation: pulse 2.5s ease-in-out infinite; }
      @keyframes pulse { 0%,100% { r: 3; opacity: 1; } 50% { r: 5; opacity: 0.5; } }

      /* Glow flicker on cards */
      .glow1 { animation: glow 5s 0s ease-in-out infinite alternate; }
      .glow2 { animation: glow 5s 1.5s ease-in-out infinite alternate; }
      .glow3 { animation: glow 5s 3s ease-in-out infinite alternate; }
      .glow4 { animation: glow 5s 0.8s ease-in-out infinite alternate; }
      @keyframes glow {
        from { opacity: 0.4; }
        to   { opacity: 0.9; }
      }

      /* Scanning line */
      .scan { animation: scan 6s linear infinite; }
      @keyframes scan {
        from { transform: translateY(-420px); }
        to   { transform: translateY(420px); }
      }

      /* Badge pulse border */
      .borderpulse { animation: borderpulse 3s ease-in-out infinite; }
      @keyframes borderpulse {
        0%,100% { stroke-opacity: 0.3; }
        50% { stroke-opacity: 0.8; }
      }

      /* Typewriter cursor */
      .cursor { animation: blink 0.8s step-end infinite; }
      @keyframes blink { 50% { opacity: 0; } }
    </style>

    <!-- Background gradient -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050510"/>
      <stop offset="40%" stop-color="#0d0025"/>
      <stop offset="100%" stop-color="#080018"/>
    </linearGradient>

    <!-- Purple glow top-left -->
    <radialGradient id="glowTL" cx="15%" cy="15%" r="50%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"/>
    </radialGradient>

    <!-- Pink glow bottom-right -->
    <radialGradient id="glowBR" cx="85%" cy="85%" r="45%">
      <stop offset="0%" stop-color="#EC4899" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#EC4899" stop-opacity="0"/>
    </radialGradient>

    <!-- Cyan glow mid -->
    <radialGradient id="glowMid" cx="70%" cy="25%" r="35%">
      <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#06B6D4" stop-opacity="0"/>
    </radialGradient>

    <!-- Logo gradients -->
    <linearGradient id="logoGrad1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="40%"  stop-color="#C4B5FD"/>
      <stop offset="75%"  stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#06B6D4"/>
    </linearGradient>
    <linearGradient id="logoGrad2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#06B6D4"/>
      <stop offset="35%"  stop-color="#A78BFA"/>
      <stop offset="70%"  stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>

    <!-- Slash gradient -->
    <linearGradient id="slashGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#F472B6"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>

    <!-- Card glass gradient -->
    <linearGradient id="card1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(139,92,246,0.12)"/>
      <stop offset="100%" stop-color="rgba(139,92,246,0.04)"/>
    </linearGradient>
    <linearGradient id="card2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(236,72,153,0.1)"/>
      <stop offset="100%" stop-color="rgba(236,72,153,0.03)"/>
    </linearGradient>
    <linearGradient id="card3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(6,182,212,0.1)"/>
      <stop offset="100%" stop-color="rgba(6,182,212,0.03)"/>
    </linearGradient>
    <linearGradient id="card4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(245,158,11,0.1)"/>
      <stop offset="100%" stop-color="rgba(245,158,11,0.03)"/>
    </linearGradient>

    <!-- Top line gradient for cards -->
    <linearGradient id="topline1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="transparent"/>
      <stop offset="50%"  stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <linearGradient id="topline2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="transparent"/>
      <stop offset="50%"  stop-color="#EC4899"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <linearGradient id="topline3" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="transparent"/>
      <stop offset="50%"  stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>
    <linearGradient id="topline4" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="transparent"/>
      <stop offset="50%"  stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="transparent"/>
    </linearGradient>

    <!-- Scan line gradient -->
    <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(139,92,246,0)"/>
      <stop offset="50%"  stop-color="rgba(139,92,246,0.06)"/>
      <stop offset="100%" stop-color="rgba(139,92,246,0)"/>
    </linearGradient>

    <!-- Blur filter for glow dots -->
    <filter id="blur4">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
    <filter id="blur8">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
    <filter id="blur2">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
    <filter id="glow-filter">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <!-- Clip -->
    <clipPath id="mainClip">
      <rect width="900" height="420" rx="16"/>
    </clipPath>
  </defs>

  <g clip-path="url(#mainClip)">

    <!-- ═══ BACKGROUND ═══ -->
    <rect width="900" height="420" fill="url(#bg)"/>
    <rect width="900" height="420" fill="url(#glowTL)"/>
    <rect width="900" height="420" fill="url(#glowBR)"/>
    <rect width="900" height="420" fill="url(#glowMid)"/>

    <!-- Subtle grid lines -->
    <g opacity="0.03" stroke="#A78BFA" stroke-width="0.5">
      <line x1="0" y1="60" x2="900" y2="60"/>
      <line x1="0" y1="120" x2="900" y2="120"/>
      <line x1="0" y1="180" x2="900" y2="180"/>
      <line x1="0" y1="240" x2="900" y2="240"/>
      <line x1="0" y1="300" x2="900" y2="300"/>
      <line x1="0" y1="360" x2="900" y2="360"/>
      <line x1="150" y1="0" x2="150" y2="420"/>
      <line x1="300" y1="0" x2="300" y2="420"/>
      <line x1="450" y1="0" x2="450" y2="420"/>
      <line x1="600" y1="0" x2="600" y2="420"/>
      <line x1="750" y1="0" x2="750" y2="420"/>
    </g>

    <!-- Scan line animation -->
    <g class="scan">
      <rect x="0" y="0" width="900" height="80" fill="url(#scanGrad)"/>
    </g>

    <!-- ═══ FLOATING GLOW DOTS (background layer) ═══ -->
    <circle cx="60"  cy="80"  r="60" fill="#7C3AED" opacity="0.08" filter="url(#blur8)" class="dot1"/>
    <circle cx="840" cy="340" r="50" fill="#EC4899" opacity="0.08" filter="url(#blur8)" class="dot2"/>
    <circle cx="450" cy="50"  r="40" fill="#06B6D4" opacity="0.06" filter="url(#blur8)" class="dot3"/>
    <circle cx="820" cy="80"  r="35" fill="#8B5CF6" opacity="0.07" filter="url(#blur8)" class="dot4"/>
    <circle cx="100" cy="360" r="40" fill="#F59E0B" opacity="0.05" filter="url(#blur8)" class="dot5"/>
    <circle cx="550" cy="390" r="45" fill="#7C3AED" opacity="0.07" filter="url(#blur8)" class="dot6"/>

    <!-- ═══ SPARKLE STARS ═══ -->
    <!-- Row 1 -->
    <g class="sp1"  transform-origin="42 35">  <text x="42"  y="35"  font-size="12" fill="#C4B5FD" text-anchor="middle" dominant-baseline="middle">✦</text></g>
    <g class="sp2"  transform-origin="120 70"> <text x="120" y="70"  font-size="8"  fill="#F9A8D4" text-anchor="middle" dominant-baseline="middle">✧</text></g>
    <g class="sp3"  transform-origin="210 30"> <text x="210" y="30"  font-size="10" fill="#67E8F9" text-anchor="middle" dominant-baseline="middle">⋆</text></g>
    <g class="sp4"  transform-origin="380 25"> <text x="380" y="25"  font-size="9"  fill="#A78BFA" text-anchor="middle" dominant-baseline="middle">✦</text></g>
    <g class="sp5"  transform-origin="520 40"> <text x="520" y="40"  font-size="7"  fill="#FDE68A" text-anchor="middle" dominant-baseline="middle">✺</text></g>
    <g class="sp6"  transform-origin="660 20"> <text x="660" y="20"  font-size="11" fill="#C4B5FD" text-anchor="middle" dominant-baseline="middle">✧</text></g>
    <g class="sp7"  transform-origin="780 55"> <text x="780" y="55"  font-size="8"  fill="#6EE7B7" text-anchor="middle" dominant-baseline="middle">⋆</text></g>
    <g class="sp8"  transform-origin="860 30"> <text x="860" y="30"  font-size="10" fill="#F9A8D4" text-anchor="middle" dominant-baseline="middle">✦</text></g>
    <!-- Row 2 -->
    <g class="sp9"  transform-origin="30 200"> <text x="30"  y="200" font-size="9"  fill="#A78BFA" text-anchor="middle" dominant-baseline="middle">✼</text></g>
    <g class="sp10" transform-origin="870 180"><text x="870" y="180" font-size="8"  fill="#67E8F9" text-anchor="middle" dominant-baseline="middle">✦</text></g>
    <!-- Row 3 (bottom) -->
    <g class="sp11" transform-origin="100 390"><text x="100" y="390" font-size="10" fill="#C4B5FD" text-anchor="middle" dominant-baseline="middle">✧</text></g>
    <g class="sp12" transform-origin="800 400"><text x="800" y="400" font-size="9"  fill="#F9A8D4" text-anchor="middle" dominant-baseline="middle">✦</text></g>

    <!-- ═══ HERO — LEFT SIDE ═══ -->

    <!-- Studio badge -->
    <g class="fadein">
      <rect x="40" y="38" width="160" height="24" rx="12" fill="rgba(139,92,246,0.12)" stroke="#8B5CF6" stroke-width="0.8" stroke-opacity="0.4" class="borderpulse"/>
      <circle cx="53" cy="50" r="4" fill="#A78BFA" class="pulse"/>
      <text x="62" y="54" class="badge-text" font-size="9.5" letter-spacing="1.5" fill="#C4B5FD">DIGITAL PRODUCT STUDIO</text>
    </g>

    <!-- Logo -->
    <g class="fadein-d1">
      <!-- Glow behind logo -->
      <text x="38" y="130" class="logo" fill="#8B5CF6" opacity="0.25" filter="url(#blur8)">/SlashEasy</text>
      <!-- Slash in pink -->
      <text x="38" y="130" class="logo" fill="url(#slashGrad)">/</text>
      <!-- SlashEasy in gradient -->
      <text x="76" y="130" class="logo" fill="url(#logoGrad1)" class="shimmer">SlashEasy</text>
    </g>

    <!-- Tagline -->
    <g class="fadein-d2">
      <text x="40" y="158" class="sub">We make complex things easy</text>
      <text x="40" y="175" class="sub" font-size="13" fill="rgba(196,181,253,0.55)">No-Code · Full-Stack · Design · Automation</text>
    </g>

    <!-- Tech pills row -->
    <g class="fadein-d3">
      <!-- Pill 1: Bubble.io -->
      <rect x="40" y="190" width="80" height="22" rx="11" fill="rgba(0,102,255,0.18)" stroke="rgba(0,102,255,0.45)" stroke-width="0.8"/>
      <text x="80" y="205" class="pill-text" fill="#93C5FD" text-anchor="middle">🫧 Bubble.io</text>

      <!-- Pill 2: Laravel -->
      <rect x="128" y="190" width="70" height="22" rx="11" fill="rgba(255,45,32,0.15)" stroke="rgba(255,45,32,0.4)" stroke-width="0.8"/>
      <text x="163" y="205" class="pill-text" fill="#FCA5A5" text-anchor="middle">⚙️ Laravel</text>

      <!-- Pill 3: Angular -->
      <rect x="206" y="190" width="70" height="22" rx="11" fill="rgba(221,0,49,0.15)" stroke="rgba(221,0,49,0.4)" stroke-width="0.8"/>
      <text x="241" y="205" class="pill-text" fill="#FCA5A5" text-anchor="middle">🔺 Angular</text>

      <!-- Pill 4: Figma -->
      <rect x="284" y="190" width="62" height="22" rx="11" fill="rgba(242,78,30,0.15)" stroke="rgba(242,78,30,0.4)" stroke-width="0.8"/>
      <text x="315" y="205" class="pill-text" fill="#FDBA74" text-anchor="middle">🎨 Figma</text>

      <!-- Pill 5: MVP -->
      <rect x="354" y="190" width="70" height="22" rx="11" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.35)" stroke-width="0.8"/>
      <text x="389" y="205" class="pill-text" fill="#6EE7B7" text-anchor="middle">🚀 MVP</text>
    </g>

    <!-- CTA strip -->
    <g class="fadein-d4">
      <text x="40" y="237" font-family="'Space Grotesk',Arial,sans-serif" font-size="12" fill="rgba(255,255,255,0.25)" letter-spacing="2">● slasheasy.com  ·  hello@slasheasy.com</text>
    </g>

    <!-- Divider line -->
    <g class="fadein-d4">
      <line x1="40" y1="254" x2="430" y2="254" stroke="url(#topline1)" stroke-width="0.8" opacity="0.5"/>
    </g>

    <!-- ═══ STAT CARDS (bottom half left) ═══ -->
    <g class="fadein-d4">

      <!-- Stat 1 -->
      <rect x="40" y="268" width="90" height="70" rx="12" fill="url(#card1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.8"/>
      <rect x="40" y="268" width="90" height="1" rx="0.5" fill="url(#topline1)" class="glow1"/>
      <text x="85" y="298" class="stat-num" text-anchor="middle">50+</text>
      <text x="85" y="314" class="stat-label" text-anchor="middle">PROJECTS</text>
      <text x="85" y="326" class="stat-label" text-anchor="middle">SHIPPED</text>

      <!-- Stat 2 -->
      <rect x="142" y="268" width="90" height="70" rx="12" fill="url(#card2)" stroke="rgba(236,72,153,0.3)" stroke-width="0.8"/>
      <rect x="142" y="268" width="90" height="1" rx="0.5" fill="url(#topline2)" class="glow2"/>
      <text x="187" y="298" class="stat-num" text-anchor="middle">30+</text>
      <text x="187" y="314" class="stat-label" text-anchor="middle">HAPPY</text>
      <text x="187" y="326" class="stat-label" text-anchor="middle">CLIENTS</text>

      <!-- Stat 3 -->
      <rect x="244" y="268" width="90" height="70" rx="12" fill="url(#card3)" stroke="rgba(6,182,212,0.3)" stroke-width="0.8"/>
      <rect x="244" y="268" width="90" height="1" rx="0.5" fill="url(#topline3)" class="glow3"/>
      <text x="289" y="298" class="stat-num" text-anchor="middle">5+</text>
      <text x="289" y="314" class="stat-label" text-anchor="middle">YEARS</text>
      <text x="289" y="326" class="stat-label" text-anchor="middle">BUILDING</text>

      <!-- Stat 4 -->
      <rect x="346" y="268" width="90" height="70" rx="12" fill="url(#card4)" stroke="rgba(245,158,11,0.3)" stroke-width="0.8"/>
      <rect x="346" y="268" width="90" height="1" rx="0.5" fill="url(#topline4)" class="glow4"/>
      <text x="391" y="298" class="stat-num" text-anchor="middle">99%</text>
      <text x="391" y="314" class="stat-label" text-anchor="middle">CLIENT</text>
      <text x="391" y="326" class="stat-label" text-anchor="middle">SATISFACTION</text>

    </g>

    <!-- ═══ VERTICAL SEPARATOR ═══ -->
    <line x1="458" y1="30" x2="458" y2="390" stroke="rgba(139,92,246,0.15)" stroke-width="0.8"/>

    <!-- ═══ RIGHT SIDE — PROJECT CARDS ═══ -->

    <!-- Section label -->
    <g class="fadein-d2">
      <text x="476" y="52" font-family="'Space Grotesk',Arial,sans-serif" font-size="9" letter-spacing="2.5" fill="#8B5CF6">✦ LIVE PROJECTS</text>
    </g>

    <!-- PROJECT CARD 1 — Bubble CRM -->
    <g class="fadein-d3">
      <rect x="476" y="62" width="196" height="78" rx="12" fill="rgba(139,92,246,0.07)" stroke="rgba(139,92,246,0.2)" stroke-width="0.8"/>
      <rect x="476" y="62" width="196" height="1.5" fill="url(#topline1)"/>
      <!-- Icon bg -->
      <rect x="488" y="73" width="28" height="28" rx="8" fill="rgba(139,92,246,0.2)"/>
      <text x="502" y="91" font-size="14" text-anchor="middle" dominant-baseline="middle">🫧</text>
      <!-- Title & desc -->
      <text x="524" y="84" font-family="'Space Grotesk',Arial,sans-serif" font-size="11" font-weight="600" fill="#E9D5FF">SlashEasy CRM</text>
      <text x="524" y="97" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">Full CRM with pipeline &amp;</text>
      <text x="524" y="109" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">automation workflows</text>
      <!-- Status dot -->
      <circle cx="658" cy="73" r="4" fill="#10B981" class="pulse" filter="url(#blur2)"/>
      <circle cx="658" cy="73" r="3" fill="#10B981" class="pulse"/>
      <!-- Tags -->
      <rect x="488" y="119" width="44" height="14" rx="7" fill="rgba(139,92,246,0.2)"/>
      <text x="510" y="129" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#C4B5FD" text-anchor="middle">Bubble.io</text>
      <rect x="537" y="119" width="36" height="14" rx="7" fill="rgba(139,92,246,0.15)"/>
      <text x="555" y="129" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#C4B5FD" text-anchor="middle">Zapier</text>
    </g>

    <!-- PROJECT CARD 2 — E-Commerce -->
    <g class="fadein-d3">
      <rect x="682" y="62" width="196" height="78" rx="12" fill="rgba(255,45,32,0.07)" stroke="rgba(255,45,32,0.2)" stroke-width="0.8"/>
      <rect x="682" y="62" width="196" height="1.5" fill="url(#topline2)"/>
      <rect x="694" y="73" width="28" height="28" rx="8" fill="rgba(255,45,32,0.2)"/>
      <text x="708" y="91" font-size="14" text-anchor="middle" dominant-baseline="middle">🛒</text>
      <text x="730" y="84" font-family="'Space Grotesk',Arial,sans-serif" font-size="11" font-weight="600" fill="#FCA5A5">E-Commerce Platform</text>
      <text x="730" y="97" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">Full-stack shop with</text>
      <text x="730" y="109" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">inventory &amp; payments</text>
      <circle cx="864" cy="73" r="4" fill="#10B981" filter="url(#blur2)"/>
      <circle cx="864" cy="73" r="3" fill="#10B981" class="pulse"/>
      <rect x="694" y="119" width="48" height="14" rx="7" fill="rgba(255,45,32,0.15)"/>
      <text x="718" y="129" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#FCA5A5" text-anchor="middle">Laravel</text>
      <rect x="748" y="119" width="44" height="14" rx="7" fill="rgba(255,45,32,0.12)"/>
      <text x="770" y="129" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#FCA5A5" text-anchor="middle">Angular</text>
    </g>

    <!-- PROJECT CARD 3 — Fleet Mgmt -->
    <g class="fadein-d4">
      <rect x="476" y="152" width="196" height="78" rx="12" fill="rgba(59,130,246,0.07)" stroke="rgba(59,130,246,0.2)" stroke-width="0.8"/>
      <rect x="476" y="152" width="196" height="1.5" fill="url(#topline3)"/>
      <rect x="488" y="163" width="28" height="28" rx="8" fill="rgba(59,130,246,0.2)"/>
      <text x="502" y="181" font-size="14" text-anchor="middle" dominant-baseline="middle">🚛</text>
      <text x="524" y="174" font-family="'Space Grotesk',Arial,sans-serif" font-size="11" font-weight="600" fill="#93C5FD">Fleet Management</text>
      <text x="524" y="187" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">GPS tracking &amp; driver</text>
      <text x="524" y="199" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">management system</text>
      <circle cx="658" cy="163" r="4" fill="#10B981" filter="url(#blur2)"/>
      <circle cx="658" cy="163" r="3" fill="#10B981" class="pulse"/>
      <rect x="488" y="209" width="48" height="14" rx="7" fill="rgba(59,130,246,0.2)"/>
      <text x="512" y="219" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#93C5FD" text-anchor="middle">Laravel</text>
      <rect x="542" y="209" width="55" height="14" rx="7" fill="rgba(59,130,246,0.15)"/>
      <text x="569" y="219" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#93C5FD" text-anchor="middle">REST API</text>
    </g>

    <!-- PROJECT CARD 4 — SaaS Dashboard -->
    <g class="fadein-d4">
      <rect x="682" y="152" width="196" height="78" rx="12" fill="rgba(236,72,153,0.07)" stroke="rgba(236,72,153,0.2)" stroke-width="0.8"/>
      <rect x="682" y="152" width="196" height="1.5" fill="url(#topline2)"/>
      <rect x="694" y="163" width="28" height="28" rx="8" fill="rgba(236,72,153,0.2)"/>
      <text x="708" y="181" font-size="14" text-anchor="middle" dominant-baseline="middle">📊</text>
      <text x="730" y="174" font-family="'Space Grotesk',Arial,sans-serif" font-size="11" font-weight="600" fill="#F9A8D4">SaaS Dashboard</text>
      <text x="730" y="187" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">Real-time analytics with</text>
      <text x="730" y="199" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">charts &amp; CSV exports</text>
      <circle cx="864" cy="163" r="4" fill="#10B981" filter="url(#blur2)"/>
      <circle cx="864" cy="163" r="3" fill="#10B981" class="pulse"/>
      <rect x="694" y="209" width="44" height="14" rx="7" fill="rgba(236,72,153,0.15)"/>
      <text x="716" y="219" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#F9A8D4" text-anchor="middle">Bubble.io</text>
      <rect x="744" y="209" width="44" height="14" rx="7" fill="rgba(236,72,153,0.12)"/>
      <text x="766" y="219" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#F9A8D4" text-anchor="middle">Angular</text>
    </g>

    <!-- PROJECT CARD 5 — LMS -->
    <g class="fadein-d5">
      <rect x="476" y="242" width="196" height="78" rx="12" fill="rgba(16,185,129,0.07)" stroke="rgba(16,185,129,0.2)" stroke-width="0.8"/>
      <rect x="476" y="242" width="196" height="1.5" fill="url(#topline3)"/>
      <rect x="488" y="253" width="28" height="28" rx="8" fill="rgba(16,185,129,0.2)"/>
      <text x="502" y="271" font-size="14" text-anchor="middle" dominant-baseline="middle">🎓</text>
      <text x="524" y="264" font-family="'Space Grotesk',Arial,sans-serif" font-size="11" font-weight="600" fill="#6EE7B7">LMS Platform</text>
      <text x="524" y="277" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">Course delivery, quizzes</text>
      <text x="524" y="289" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">&amp; certifications</text>
      <circle cx="658" cy="253" r="4" fill="#10B981" filter="url(#blur2)"/>
      <circle cx="658" cy="253" r="3" fill="#10B981" class="pulse"/>
      <rect x="488" y="299" width="44" height="14" rx="7" fill="rgba(16,185,129,0.15)"/>
      <text x="510" y="309" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#6EE7B7" text-anchor="middle">Laravel</text>
      <rect x="538" y="299" width="44" height="14" rx="7" fill="rgba(16,185,129,0.12)"/>
      <text x="560" y="309" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#6EE7B7" text-anchor="middle">Angular</text>
    </g>

    <!-- PROJECT CARD 6 — Marketplace -->
    <g class="fadein-d5">
      <rect x="682" y="242" width="196" height="78" rx="12" fill="rgba(245,158,11,0.07)" stroke="rgba(245,158,11,0.2)" stroke-width="0.8"/>
      <rect x="682" y="242" width="196" height="1.5" fill="url(#topline4)"/>
      <rect x="694" y="253" width="28" height="28" rx="8" fill="rgba(245,158,11,0.2)"/>
      <text x="708" y="271" font-size="14" text-anchor="middle" dominant-baseline="middle">🛍️</text>
      <text x="730" y="264" font-family="'Space Grotesk',Arial,sans-serif" font-size="11" font-weight="600" fill="#FDE68A">Multi-Vendor Market</text>
      <text x="730" y="277" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">Booking, payments,</text>
      <text x="730" y="289" font-family="'Space Grotesk',Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.4)">vendor dashboards</text>
      <circle cx="864" cy="253" r="4" fill="#10B981" filter="url(#blur2)"/>
      <circle cx="864" cy="253" r="3" fill="#10B981" class="pulse"/>
      <rect x="694" y="299" width="44" height="14" rx="7" fill="rgba(245,158,11,0.15)"/>
      <text x="716" y="309" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#FDE68A" text-anchor="middle">Bubble.io</text>
      <rect x="744" y="299" width="36" height="14" rx="7" fill="rgba(245,158,11,0.12)"/>
      <text x="762" y="309" font-family="'Space Grotesk',Arial,sans-serif" font-size="8.5" fill="#FDE68A" text-anchor="middle">Stripe</text>
    </g>

    <!-- ═══ BOTTOM ROW CONTACT + FIGMA ═══ -->
    <g class="fadein-d5">

      <!-- Figma card -->
      <rect x="476" y="332" width="130" height="56" rx="12" fill="rgba(242,78,30,0.08)" stroke="rgba(242,78,30,0.22)" stroke-width="0.8"/>
      <text x="491" y="354" font-family="'Space Grotesk',Arial,sans-serif" font-size="10" font-weight="600" fill="#FDBA74">🎨 Figma Design</text>
      <text x="491" y="368" font-family="'Space Grotesk',Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.38)">UI/UX · Systems · Prototypes</text>
      <text x="491" y="380" font-family="'Space Grotesk',Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.38)">Mobile &amp; Web Designs</text>

      <!-- HR card -->
      <rect x="616" y="332" width="122" height="56" rx="12" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.22)" stroke-width="0.8"/>
      <text x="631" y="354" font-family="'Space Grotesk',Arial,sans-serif" font-size="10" font-weight="600" fill="#C4B5FD">👥 HR Management</text>
      <text x="631" y="368" font-family="'Space Grotesk',Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.38)">Payroll · Leave · Onboard</text>
      <text x="631" y="380" font-family="'Space Grotesk',Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.38)">Laravel + Angular</text>

      <!-- Booking card -->
      <rect x="748" y="332" width="130" height="56" rx="12" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.22)" stroke-width="0.8"/>
      <text x="763" y="354" font-family="'Space Grotesk',Arial,sans-serif" font-size="10" font-weight="600" fill="#6EE7B7">📅 Booking App</text>
      <text x="763" y="368" font-family="'Space Grotesk',Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.38)">Calendar · Reminders</text>
      <text x="763" y="380" font-family="'Space Grotesk',Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.38)">Laravel · Stripe</text>

    </g>

    <!-- ═══ FOOTER BAR ═══ -->
    <g class="fadein-d5">
      <rect x="0" y="398" width="900" height="22" fill="rgba(0,0,0,0.35)"/>
      <line x1="0" y1="398" x2="900" y2="398" stroke="rgba(139,92,246,0.2)" stroke-width="0.8"/>
      <!-- left dots -->
      <circle cx="20"  cy="409" r="3" fill="#8B5CF6" opacity="0.6"/>
      <circle cx="30"  cy="409" r="3" fill="#EC4899" opacity="0.6"/>
      <circle cx="40"  cy="409" r="3" fill="#06B6D4" opacity="0.6"/>
      <!-- center text -->
      <text x="450" y="413" font-family="'Space Grotesk',Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.3)" text-anchor="middle" letter-spacing="1">© 2025 SLASHEASY · MAKING COMPLEX THINGS EASY · ALL RIGHTS RESERVED</text>
      <!-- right sparkle -->
      <text x="875" y="413" font-size="10" fill="#A78BFA" opacity="0.6">✦</text>
    </g>

    <!-- ═══ BORDER FRAME ═══ -->
    <rect x="1" y="1" width="898" height="418" rx="15" fill="none" stroke="rgba(139,92,246,0.2)" stroke-width="1" class="borderpulse"/>

    <!-- Corner accents -->
    <g opacity="0.5">
      <path d="M1 30 L1 1 L30 1" fill="none" stroke="#8B5CF6" stroke-width="1.5"/>
      <path d="M870 1 L899 1 L899 30" fill="none" stroke="#8B5CF6" stroke-width="1.5"/>
      <path d="M1 390 L1 419 L30 419" fill="none" stroke="#8B5CF6" stroke-width="1.5"/>
      <path d="M870 419 L899 419 L899 390" fill="none" stroke="#8B5CF6" stroke-width="1.5"/>
    </g>

  </g>
</svg>
<!-- Animated Banner -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=200&section=header&text=SlashEasy&fontSize=70&fontColor=ffffff&fontAlignY=38&desc=Crafting%20Digital%20Experiences%20That%20Matter&descAlignY=58&descSize=18&animation=fadeIn" />

<!-- Typing Animation -->
<a href="https://slasheasy.com">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=A78BFA&center=true&vCenter=true&width=600&lines=No-Code+%26+Full-Stack+Development;Bubble.io+%7C+Laravel+%7C+Angular;Building+Scalable+Web+Applications;Figma+Design+%E2%86%92+Production+Code;Your+Vision%2C+Our+Execution" alt="Typing SVG" />
</a>

<br/>

<!-- Badges -->
[![Website](https://img.shields.io/badge/🌐_Website-slasheasy.com-7C3AED?style=for-the-badge&logoColor=white)](https://slasheasy.com)
[![Bubble.io](https://img.shields.io/badge/Bubble.io-Expert-0D6EFD?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==&logoColor=white)](https://bubble.io)
[![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io)
[![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)](https://figma.com)

</div>

---

## 🚀 About SlashEasy

> **We make complex things easy.** SlashEasy is a full-service digital product studio specializing in **no-code development with Bubble.io**, robust **Laravel backends**, dynamic **Angular frontends**, and pixel-perfect **Figma-to-code** delivery.

We partner with startups, SMEs, and enterprises to transform ideas into fast, scalable, and beautiful digital products — without the friction.

---

## 🛠️ Tech Stack & Expertise

<div align="center">

| 🔵 No-Code | 🔴 Backend | 🔴 Frontend | 🎨 Design |
|:---:|:---:|:---:|:---:|
| Bubble.io | Laravel | Angular | Figma |
| Webflow | PHP | TypeScript | UI/UX |
| Zapier | MySQL | HTML/CSS | Wireframing |
| Make (Integromat) | REST APIs | JavaScript | Prototyping |

</div>

---

## 🌐 Live Projects

### 🫧 Bubble.io Applications

| # | Project | Description | Status |
|---|---------|-------------|--------|
| 1 | **SlashEasy CRM** | Custom CRM built entirely in Bubble.io for client relationship management | 🟢 Live |
| 2 | **Marketplace Platform** | Multi-vendor marketplace with booking & payment integrations | 🟢 Live |
| 3 | **SaaS Dashboard** | Analytics and reporting dashboard with real-time data | 🟢 Live |
| 4 | **Workflow Automation App** | No-code workflow builder with API integrations | 🟢 Live |
| 5 | **Client Portal** | White-labeled client portal with role-based access | 🟢 Live |

---

### ⚙️ Laravel Projects (Full-Stack)

| # | Project | Tech Stack | Status |
|---|---------|-----------|--------|
| 1 | **E-Commerce Platform** | Laravel + Angular + MySQL | 🟢 Live |
| 2 | **Fleet Management System** | Laravel + REST API + Angular | 🟢 Live |
| 3 | **Booking & Scheduling App** | Laravel + Livewire + Stripe | 🟢 Live |
| 4 | **Multi-tenant SaaS App** | Laravel + Angular + Redis | 🟢 Live |
| 5 | **API Gateway Service** | Laravel Sanctum + OAuth2 | 🟢 Live |

---

### 🔺 Angular Applications

| # | Project | Description | Status |
|---|---------|-------------|--------|
| 1 | **Admin Control Panel** | Feature-rich admin panel with charting & analytics | 🟢 Live |
| 2 | **Real Estate Portal** | Property listing and search with map integration | 🟢 Live |
| 3 | **HR Management System** | Leave tracking, payroll, and employee management | 🟢 Live |
| 4 | **Learning Management System** | Course delivery platform with progress tracking | 🟢 Live |

---

## 📊 GitHub Stats

<div align="center">

<img height="160em" src="https://github-readme-stats.vercel.app/api?username=slasheasy&show_icons=true&theme=midnight-purple&include_all_commits=true&count_private=true&hide_border=true&bg_color=0d0d1a" />
<img height="160em" src="https://github-readme-stats.vercel.app/api/top-langs/?username=slasheasy&layout=compact&theme=midnight-purple&hide_border=true&bg_color=0d0d1a" />

<br/>

<img src="https://github-readme-streak-stats.herokuapp.com/?user=slasheasy&theme=midnight-purple&hide_border=true&background=0d0d1a&stroke=7C3AED&ring=A78BFA&fire=C084FC&currStreakLabel=ffffff" />

<br/>

<img src="https://github-readme-activity-graph.vercel.app/graph?username=slasheasy&theme=react-dark&bg_color=0d0d1a&color=A78BFA&line=7C3AED&point=C084FC&area=true&hide_border=true" />

</div>

---

## 🎨 Design Portfolio

We don't just code — we design. Our Figma projects cover:

- 🖼️ **UI/UX Wireframes** — From rough sketches to high-fidelity designs
- 🎨 **Design Systems** — Reusable component libraries and style guides
- 📱 **Mobile App Designs** — iOS & Android prototypes
- 💻 **Web App Interfaces** — SaaS dashboards, portals, and landing pages
- 🔄 **Interactive Prototypes** — Clickable Figma flows for client approval

> 💬 *Interested in seeing our Figma work? Reach out — we'd love to share our portfolio!*

---

## 🤝 Work With Us

<div align="center">

```
📌 Got an idea?  →  We scope it.
🎨 Have a design?  →  We build it.
⚙️ Need a system?  →  We architect it.
🚀 Ready to launch?  →  We deploy it.
```

</div>

Whether you're a **startup** building an MVP, an **enterprise** modernizing legacy systems, or a **business** automating workflows — SlashEasy is your end-to-end digital partner.

---

## 📬 Get In Touch

<div align="center">

[![Email](https://img.shields.io/badge/Email-hello@slasheasy.com-7C3AED?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hello@slasheasy.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-SlashEasy-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/company/slasheasy)
[![Twitter](https://img.shields.io/badge/Twitter-@slasheasy-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/slasheasy)
[![Website](https://img.shields.io/badge/Website-slasheasy.com-7C3AED?style=for-the-badge&logo=google-chrome&logoColor=white)](https://slasheasy.com)

</div>

---

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:24243e,50:302b63,100:0f0c29&height=120&section=footer&animation=fadeIn" />

**© 2025 SlashEasy · Built with ❤️ and clean code**

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=slasheasy.slasheasy&color=7C3AED)

</div>
