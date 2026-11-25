import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, CheckCircle2, Compass, Heart, User, Users, X } from 'lucide-react';
import {
  CAMPAIGN_COLLECTION,
  CAMPAIGN_DOC_ID,
  CAMPAIGN_TITLE_TELUGU,
  MEMBERS_SUBCOLLECTION,
  OperationType,
  db,
  getOrCreateDeviceId,
  handleFirestoreError,
} from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScissorLogo } from './components/ScissorLogo';
import { ThankYouModal } from './components/ThankYouModal';

const PORTRAIT_IMAGE_SRC = '/assets/aistudio/IMG_6823_c5503f94.PNG';
const PORTRAIT_BG_SRC = '/assets/aistudio/IMG_6825.JPG_cff378fb.jpeg';

const ACCOMPLISHMENTS_TELUGU = [
  'అపర్ణ అమ్మవారి కోనేరును పాదగయ స్థాయిలో నిర్మించాం.',
  'గ్రామ ప్రజల ఆఖరి మజిలీ అయిన కర్మభూమిని, సకల వసతులతో సుందరంగా నిర్మించి గ్రామానికి అంకితం చేశాం.',
  'ముసళ్ళ బందను శుభ్రం చేశాం.',
  'మంచినీటి కోసం 2 ఓవర్\u200cహెడ్ ట్యాంకులు, కొత్త పైప్\u200cలైన్ వేశాం.',
  'వాటర్ ఫిల్టర్ సిస్టమ్\u200cను మార్చి, ఒక్క రూపాయి కూడా వసూలు చేయకుండా అందుబాటులోకి తెచ్చాం.',
  '14 వార్డుల్లో సి.సి. రోడ్లు వేశాం. ముఖ్యంగా 7, 9 వార్డుల్లో కూడా వేశాం.',
  'చెత్త సేకరణకు ట్రాక్టర్ ఏర్పాటు చేశాం.',
  'వీధిలైట్ల సమస్య వస్తే రెండు రోజుల్లోనే పరిష్కరించే విధానం తీసుకొచ్చాం.',
  'గజ్జలమ్మ గుడి సెంటర్\u200cలో బోర్ కుప్పకూలినప్పుడు, రాత్రింబవళ్లు పనిచేసి 20 రోజుల్లో కొత్త బోర్ వేయించాం.',
];

const UPCOMING_PLANS_TELUGU = [
  'గ్రామంలో అన్ని వసతులతో కూడిన ఒక కళ్యాణ మండపాన్ని నిర్మించి, మన గ్రామ ప్రజలకు వార్షిక ఇంటిలో జరిగే శుభకార్యాలను మరింత ఆనందంగా, ఆహ్లాదంగా జరుపుకునే విధంగా చేస్తాను.',
  'గ్రామంలో ప్రతి ముఖ్యమైన కూడలిలో సీసీ కెమెరా నిఘా పెట్టి, పంచాయతీ పరిధిలో కంట్రోల్ రూమ్ ఏర్పాటు చేసి గ్రామం మొత్తం ఒక సెక్యూరిటీ లైన్లోకి తీసుకొస్తాను.',
  '1వ వార్డు నుండి 7వ వార్డు వరకు ఉన్న ప్రజలకు దగ్గరలో ప్రత్యేకంగా ఆర్.ఓ. ప్లాంట్ ఏర్పాటు చేస్తాను.',
  'గ్రామంలో డంపింగ్ యార్డ్ ఏర్పాటు చేసి, తడి చెత్త - పొడి చెత్త విధానాన్ని మీ అందరికీ సహకారంతో పాటించి, గ్రామ పారిశుధ్యానికి అత్యంత ప్రాధాన్యత తీసుకొస్తాను.',
  'గ్రామానికి సంబంధించిన కర్మభూమి (శ్మశానం) లో మిగిలిన బరియల్ (ఖననం) చేసే ప్రదేశాన్ని కూడా అన్ని వసతులతో అత్యంత సుందరంగా తీర్చిదిద్దుతాను.',
  'అత్యవసర పరిస్థితులలో గ్రామ ప్రజలకు అందుబాటులో ఉండే విధంగా ఒక అంబులెన్స్ ఏర్పాటు చేసి 24/7 అందుబాటులో ఉంచుతాను.',
  'భీమయ్య కోనేరును అత్యంత సుందరంగా తీర్చిదిద్ది 1, 2 మరియు 3 వార్డు ప్రజలకు అందుబాటులో ఉంచుతాను.',
  '11, 12 మరియు 14 వార్డు ప్రజలు పడుతున్న డ్రైనేజ్ సమస్యను అధిగమించడానికి అన్ని విధాలుగా కృషి చేసి రాబోవు 2 సంవత్సరాలలో ఒక పరిష్కారం చూపిస్తాను.',
  '5 మరియు 6 వార్డు ప్రజలకు ఉన్న కర్ణభూమిని అన్ని వసతులతో సుందరంగా అభివృద్ధి చేసి నా హరిజనపేట సోదరులకు అందుబాటులో తీసుకొస్తాను.',
  'గ్రామ యువత కోసం అన్ని సదుపాయాలతో ఒక ఆధునిక లైబ్రరీని ఏర్పాటు చేసి అందుబాటులోకి తీసుకొస్తాను.',
];

function SocialProofApp() {
  const prefersReducedMotion = useReducedMotion();
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [supportersCount, setSupportersCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(true);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [isCheckingMember, setIsCheckingMember] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showThankYou, setShowThankYou] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const [topMenuOpen, setTopMenuOpen] = useState<boolean>(false);
  const primaryCtaRef = useRef<HTMLDivElement | null>(null);
  const [isPrimaryCtaVisible, setIsPrimaryCtaVisible] = useState<boolean>(true);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const target = primaryCtaRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPrimaryCtaVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const showStickyJoinCta =
    hasScrolled && !isPrimaryCtaVisible && !showThankYou && !topMenuOpen;

  useEffect(() => {
    if (!topMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTopMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [topMenuOpen]);

  // Throw fatal Firestore errors to React ErrorBoundary
  if (fatalError) {
    throw fatalError;
  }

  // Real-time Firestore listener for total community member count
  useEffect(() => {
    const campaignPath = `${CAMPAIGN_COLLECTION}/${CAMPAIGN_DOC_ID}`;
    const campaignRef = doc(db, CAMPAIGN_COLLECTION, CAMPAIGN_DOC_ID);

    const unsubscribe = onSnapshot(
      campaignRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const count =
            typeof data?.supportersCount === 'number' &&
            Number.isFinite(data.supportersCount)
              ? data.supportersCount
              : 0;
          setSupportersCount(count);
        } else {
          setSupportersCount(0);
        }
        setIsLoadingCount(false);
        setActionError(null);
      },
      (error) => {
        setIsLoadingCount(false);
        try {
          handleFirestoreError(error, OperationType.GET, campaignPath);
        } catch (wrapped) {
          setFatalError(
            wrapped instanceof Error ? wrapped : new Error(String(wrapped))
          );
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for this device's membership status (enforces 1 join per device)
  useEffect(() => {
    const memberPath = `${CAMPAIGN_COLLECTION}/${CAMPAIGN_DOC_ID}/${MEMBERS_SUBCOLLECTION}/${deviceId}`;
    const memberRef = doc(
      db,
      CAMPAIGN_COLLECTION,
      CAMPAIGN_DOC_ID,
      MEMBERS_SUBCOLLECTION,
      deviceId
    );

    const unsubscribe = onSnapshot(
      memberRef,
      (snapshot) => {
        setHasJoined(snapshot.exists());
        setIsCheckingMember(false);
      },
      (error) => {
        setIsCheckingMember(false);
        try {
          handleFirestoreError(error, OperationType.GET, memberPath);
        } catch (wrapped) {
          setFatalError(
            wrapped instanceof Error ? wrapped : new Error(String(wrapped))
          );
        }
      }
    );

    return () => unsubscribe();
  }, [deviceId]);

  const handleJoinCommunity = useCallback(async () => {
    if (isSubmitting || isCheckingMember) return;

    // Already joined from this device: open Thank You / Share card popup without incrementing
    if (hasJoined) {
      setShowThankYou(true);
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    const campaignPath = `${CAMPAIGN_COLLECTION}/${CAMPAIGN_DOC_ID}`;
    const campaignRef = doc(db, CAMPAIGN_COLLECTION, CAMPAIGN_DOC_ID);
    const memberRef = doc(
      db,
      CAMPAIGN_COLLECTION,
      CAMPAIGN_DOC_ID,
      MEMBERS_SUBCOLLECTION,
      deviceId
    );

    try {
      const result = await runTransaction(db, async (transaction) => {
        const [memberSnapshot, campaignSnapshot] = await Promise.all([
          transaction.get(memberRef),
          transaction.get(campaignRef),
        ]);

        // Guard against race conditions / duplicate tabs on the same device
        if (memberSnapshot.exists()) {
          const existingCount = campaignSnapshot.exists()
            ? Number(campaignSnapshot.data()?.supportersCount ?? 0)
            : 0;
          return { alreadyJoined: true, count: existingCount };
        }

        transaction.set(memberRef, {
          deviceId,
          joinedAt: serverTimestamp(),
        });

        if (!campaignSnapshot.exists()) {
          transaction.set(campaignRef, {
            title: CAMPAIGN_TITLE_TELUGU,
            supportersCount: 1,
            lastDeviceId: deviceId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return { alreadyJoined: false, count: 1 };
        }

        const currentData = campaignSnapshot.data();
        const currentCount =
          typeof currentData?.supportersCount === 'number' &&
          Number.isInteger(currentData.supportersCount) &&
          currentData.supportersCount >= 1
            ? currentData.supportersCount
            : 0;

        const updatedCount = currentCount + 1;

        transaction.update(campaignRef, {
          supportersCount: updatedCount,
          lastDeviceId: deviceId,
          updatedAt: serverTimestamp(),
        });

        return { alreadyJoined: false, count: updatedCount };
      });

      setSupportersCount(result.count);
      setHasJoined(true);
      setShowThankYou(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Quota exceeded')) {
        setActionError(
          'Daily live community quota has been reached. Please try again tomorrow.'
        );
      } else {
        setActionError(
          'Could not join the community right now. Please check your connection and try again.'
        );
        try {
          handleFirestoreError(error, OperationType.WRITE, campaignPath);
        } catch {
          // Structured error logged via handleFirestoreError
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [deviceId, hasJoined, isCheckingMember, isSubmitting]);

  return (
    <div className="min-h-dvh bg-[#FBFBFD] text-[#1D1D1F] selection:bg-[#0071E3]/15 selection:text-[#0071E3]">
      {/* Floating Sticky Top Elements: "Social Proof" (left) + "list_2" Menu Icon (right) over a soft white gradient shade */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 h-16 w-full">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#FBFBFD]/95 via-[#FBFBFD]/65 to-transparent"
        />
        <div className="relative z-10 mx-auto flex h-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <a
            href="#supporters"
            className="pointer-events-auto inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-[-0.025em] text-[#1D1D1F] whitespace-nowrap shrink-0 sm:text-xl rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0071E3]"
          >
            <ScissorLogo className="h-7 w-7 sm:h-8 sm:w-8" />
            <span>Social Proof</span>
          </a>

          <div className="pointer-events-auto relative">
            <button
              type="button"
              onClick={() => setTopMenuOpen((prev) => !prev)}
              aria-label={topMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={topMenuOpen}
              aria-controls="top-list-menu"
              className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full text-[#1D1D1F] transition-colors duration-150 hover:bg-black/[0.05] active:scale-[0.95] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]"
            >
              {topMenuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 9H20M4 15H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>

            <AnimatePresence>
              {topMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setTopMenuOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <motion.nav
                    id="top-list-menu"
                    aria-label="Quick menu"
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -6, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -6, scale: 0.98 }
                    }
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-modal absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-2xl p-2 text-left"
                  >
                    <a
                      href="#supporters"
                      onClick={() => setTopMenuOpen(false)}
                      className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.05]"
                    >
                      <Users className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
                      <span>Community</span>
                    </a>
                    <a
                      href="#profile"
                      onClick={() => setTopMenuOpen(false)}
                      className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.05]"
                    >
                      <User className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
                      <span>Profile</span>
                    </a>
                    <a
                      href="#works"
                      onClick={() => setTopMenuOpen(false)}
                      className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 font-telugu text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.05]"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
                      <span>నేను చేసినవి</span>
                    </a>
                    <a
                      href="#plans"
                      onClick={() => setTopMenuOpen(false)}
                      className="flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 font-telugu text-sm font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.05]"
                    >
                      <Compass className="h-4 w-4 text-[#6E6E73]" aria-hidden="true" />
                      <span>నేను చేయబోతున్నవి</span>
                    </a>
                    <div className="my-1.5 border-t border-black/[0.07]" />
                    <button
                      type="button"
                      onClick={() => {
                        setTopMenuOpen(false);
                        void handleJoinCommunity();
                      }}
                      disabled={isSubmitting || isCheckingMember}
                      className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer ${
                        hasJoined
                          ? 'text-emerald-700 hover:bg-emerald-500/10'
                          : 'text-[#0071E3] hover:bg-[#0071E3]/[0.08]'
                      }`}
                    >
                      {hasJoined ? (
                        <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Heart
                          className="h-4 w-4 fill-[#0071E3] text-[#0071E3]"
                          aria-hidden="true"
                        />
                      )}
                      <span>
                        {isSubmitting
                          ? 'Joining...'
                          : hasJoined
                            ? 'You joined'
                            : 'Join Community'}
                      </span>
                    </button>
                  </motion.nav>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main>
        {/* Top 100%-Width Hero Band: Blurred Background ends precisely at the bottom of the portrait cutout */}
        <div className="relative w-full overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden"
          >
            <img
              src={PORTRAIT_BG_SRC}
              alt=""
              referrerPolicy="no-referrer"
              className="h-full w-full scale-105 object-cover blur-[14px] opacity-95"
            />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 pt-28 sm:px-8 sm:pt-32 lg:pt-36">
            {/* Section 1: Our Tatiparthi Frosted Pill + Telugu Greeting + Gradient "Community" Heading + Live Count */}
            <section
              id="supporters"
              aria-labelledby="supporters-heading"
              className="scroll-mt-20 flex flex-col items-center text-center"
            >
              {/* Snug frosted 10% opacity yellow pill for Our Tatiparthi */}
              <div className="mb-4 inline-flex items-center justify-center rounded-full border border-yellow-500/85 bg-yellow-400/10 px-2.5 py-0.5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:mb-5">
                <span className="font-display text-[11px] font-semibold leading-tight tracking-[0.015em] text-yellow-700 sm:text-xs">
                  Our Tatiparthi
                </span>
              </div>

              <p
                lang="te"
                className="font-telugu text-2xl font-bold leading-snug tracking-[-0.015em] text-[#1D1D1F] sm:text-3xl lg:text-[2.125rem]"
              >
                <span className="block">గ్రామ ప్రజానీకానికి</span>
                <span className="block">ప్రియమైన నమస్కారం</span>
              </p>

              <p
                lang="te"
                className="mx-auto mt-3 mb-7 max-w-lg font-telugu text-[13px] font-medium leading-relaxed text-[#424245] sm:mt-4 sm:mb-8 sm:text-sm text-balance"
              >
                మీ ఇంటి బిడ్డగా, ఎల్లప్పుడూ మీ మంచి కోరుకునేవాడిగా సర్పంచ్ ఎన్నికల్లో మీ ముందుకు వస్తున్నాను. మన ఊరి అభివృద్ధి కోసం మీ అమూల్యమైన మద్దతు నాకు ఎంతగానో అవసరం.
              </p>

              <h1
                id="supporters-heading"
                className="font-display text-3xl font-bold tracking-[-0.03em] bg-gradient-to-r from-[#1D1D1F] via-[#0071E3] to-[#5856D6] bg-clip-text text-transparent sm:text-5xl text-balance"
              >
                Community
              </h1>

              {/* Monumental real-time counter */}
              <div className="mt-2.5 flex flex-col items-center justify-center sm:mt-3.5">
                {isLoadingCount ? (
                  <div
                    aria-label="Loading community members count"
                    className="h-14 w-32 animate-pulse rounded-2xl bg-[#E8E8ED] sm:h-20 sm:w-44"
                  />
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.p
                      key={supportersCount}
                      initial={
                        prefersReducedMotion
                          ? false
                          : { opacity: 0.35, y: -6, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 6, scale: 0.98 }
                      }
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      aria-live="polite"
                      className="font-display text-6xl font-semibold tracking-[-0.045em] text-[#1D1D1F] tabular-nums sm:text-7xl lg:text-[5rem] leading-none"
                    >
                      {supportersCount.toLocaleString('en-IN')}
                    </motion.p>
                  </AnimatePresence>
                )}

                <p className="mt-3 inline-flex items-center justify-center gap-2 text-xs font-medium tracking-normal text-[#6E6E73] sm:text-sm">
                  <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span>Community members</span>
                </p>
              </div>
            </section>

            {/* Frameless cutout portrait resting flush on the bottom edge of the 100%-width background */}
            <div
              id="profile"
              className="scroll-mt-24 mt-8 w-full max-w-[360px] sm:mt-10 sm:max-w-[460px]"
            >
              {imageFailed ? (
                <div className="mb-6 flex aspect-square w-full flex-col items-center justify-center rounded-[26px] bg-white/70 backdrop-blur-md p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#86868B] shadow-xs">
                    <User className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="mt-4 font-telugu text-lg font-semibold text-[#1D1D1F]">
                    {CAMPAIGN_TITLE_TELUGU}
                  </p>
                </div>
              ) : (
                <div className="relative flex justify-center">
                  <img
                    src={PORTRAIT_IMAGE_SRC}
                    alt={`${CAMPAIGN_TITLE_TELUGU} — Dasam Baby Venkatesh`}
                    referrerPolicy="no-referrer"
                    onError={() => setImageFailed(true)}
                    className="block h-auto max-h-[380px] sm:max-h-[440px] w-full object-contain object-bottom drop-shadow-[0_14px_26px_rgba(0,0,0,0.08)]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Soft light white gradient fade over the portrait cutout bottom edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-[#FBFBFD] via-[#FBFBFD]/60 to-transparent sm:h-24"
          />
        </div>

        {/* Clean White Lower Section: Telugu Title -> Join Community / You joined Button */}
        <section
          aria-labelledby="leader-telugu-title"
          className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-16 pt-7 sm:px-8 sm:pb-20 sm:pt-8"
        >
          {/* Telugu Title directly below the photo */}
          <div className="text-center">
            <h2
              id="leader-telugu-title"
              lang="te"
              className="font-telugu text-[28px] font-bold leading-snug tracking-[-0.015em] text-[#1D1D1F] sm:text-4xl text-balance"
            >
              {CAMPAIGN_TITLE_TELUGU}
            </h2>
            <p className="mt-1.5 text-sm font-normal text-[#6E6E73] sm:text-base">
              Dasam Baby Venkatesh
            </p>
          </div>

          {/* Classic Apple-style Join Community -> You joined CTA */}
          <div
            ref={primaryCtaRef}
            className="mt-7 flex w-full max-w-[300px] flex-col items-center sm:mt-8"
          >
            <motion.button
              type="button"
              onClick={handleJoinCommunity}
              disabled={isSubmitting || isCheckingMember}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className={`group relative flex min-h-[54px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-full px-8 py-3.5 font-display text-[16px] font-semibold tracking-[-0.01em] transition-all duration-200 disabled:cursor-wait disabled:opacity-75 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 ${
                hasJoined
                  ? 'bg-emerald-500/12 text-emerald-800 ring-1 ring-emerald-600/30 hover:bg-emerald-500/18 focus-visible:outline-emerald-600'
                  : 'bg-[#0071E3] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_24px_-10px_rgba(0,113,227,0.48)] hover:bg-[#0077ED] focus-visible:outline-[#0071E3]'
              }`}
            >
              {/* Subtle glossy specular light sweep only while actionable to join */}
              {!hasJoined && (
                <span
                  aria-hidden="true"
                  className="support-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/28 to-transparent"
                />
              )}

              <motion.span
                animate={
                  isSubmitting && !prefersReducedMotion
                    ? { scale: [1, 1.22, 1] }
                    : { scale: 1 }
                }
                transition={{
                  repeat: isSubmitting ? Infinity : 0,
                  duration: 0.65,
                }}
                className="relative flex items-center justify-center"
              >
                {hasJoined ? (
                  <Check
                    className="h-[19px] w-[19px] text-emerald-700"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                ) : (
                  <Heart
                    className="h-[18px] w-[18px] fill-white text-white transition-transform duration-200 group-hover:scale-110"
                    aria-hidden="true"
                  />
                )}
              </motion.span>
              <span className="relative whitespace-nowrap">
                {isCheckingMember
                  ? 'Checking...'
                  : isSubmitting
                    ? 'Joining...'
                    : hasJoined
                      ? 'You joined'
                      : 'Join Community'}
              </span>
            </motion.button>

            {/* Quiet inline error or Telugu prompt */}
            {actionError && (
              <p
                role="alert"
                className="mt-3.5 text-center text-xs font-medium text-[#D70015] sm:text-sm"
              >
                {actionError}
              </p>
            )}

            {!actionError && (
              <p
                lang="te"
                className="mt-3.5 text-center font-telugu text-[13px] font-medium text-[#6E6E73]"
              >
                {hasJoined
                  ? 'మీ మద్దతు నమోదు చేయబడింది · షేర్ చేయడానికి క్లిక్ చేయండి'
                  : 'మీ మద్దతు నమోదు చేయండి'}
              </p>
            )}
          </div>
        </section>

        {/* Section: నేను చేసినవి (Clean Apple Editorial Numbered List) */}
        <section
          id="works"
          aria-labelledby="works-heading"
          className="scroll-mt-20 mx-auto w-full max-w-2xl px-5 pb-14 sm:px-8 sm:pb-16"
        >
          <div className="border-t border-black/[0.08] pt-12 sm:pt-14">
            <h2
              id="works-heading"
              lang="te"
              className="text-center font-telugu text-2xl font-bold tracking-[-0.02em] text-[#1D1D1F] sm:text-3xl"
            >
              నేను చేసినవి
            </h2>

            <ol className="mt-8 divide-y divide-black/[0.06] sm:mt-10">
              {ACCOMPLISHMENTS_TELUGU.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 sm:gap-5 sm:py-5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 font-display text-sm font-semibold tracking-tight text-[#0071E3] tabular-nums sm:text-[15px]"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p
                    lang="te"
                    className="font-telugu text-[15px] font-medium leading-relaxed text-[#1D1D1F] sm:text-[17px]"
                  >
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Section: నేను చేయబోతున్నవి (Clean Apple Editorial Numbered List) */}
        <section
          id="plans"
          aria-labelledby="plans-heading"
          className="scroll-mt-20 mx-auto w-full max-w-2xl px-5 pb-20 sm:px-8 sm:pb-24"
        >
          <div className="border-t border-black/[0.08] pt-12 sm:pt-14">
            <h2
              id="plans-heading"
              lang="te"
              className="text-center font-telugu text-2xl font-bold tracking-[-0.02em] text-[#1D1D1F] sm:text-3xl"
            >
              నేను చేయబోతున్నవి
            </h2>

            <ol className="mt-8 divide-y divide-black/[0.06] sm:mt-10">
              {UPCOMING_PLANS_TELUGU.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 sm:gap-5 sm:py-5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 font-display text-sm font-semibold tracking-tight text-[#0071E3] tabular-nums sm:text-[15px]"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p
                    lang="te"
                    className="font-telugu text-[15px] font-medium leading-relaxed text-[#1D1D1F] sm:text-[17px]"
                  >
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      {/* Quiet Apple-style Footer */}
      <footer className="relative z-10 border-t border-black/[0.06] pb-24 pt-6 sm:pb-28">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-5 text-xs text-[#86868B] sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-[#424245]">
              Social Proof
            </span>
            <span aria-hidden="true">·</span>
            <span lang="te" className="font-telugu">
              {CAMPAIGN_TITLE_TELUGU}
            </span>
          </div>
          <span>Live community support</span>
        </div>
      </footer>

      {/* Floating Sticky Bottom Join Community CTA (appears while scrolling when inline CTA is off-screen) */}
      <AnimatePresence>
        {showStickyJoinCta && (
          <motion.div
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 w-full"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FBFBFD]/95 via-[#FBFBFD]/70 to-transparent"
            />
            <div className="relative z-10 mx-auto flex max-w-5xl justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-8">
              <motion.button
                type="button"
                onClick={handleJoinCommunity}
                disabled={isSubmitting || isCheckingMember}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className={`pointer-events-auto group relative flex min-h-[54px] w-full max-w-[300px] items-center justify-center gap-2.5 overflow-hidden rounded-full px-8 py-3.5 font-display text-[16px] font-semibold tracking-[-0.01em] transition-all duration-200 disabled:cursor-wait disabled:opacity-75 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 ${
                  hasJoined
                    ? 'bg-[#EAF8EE]/95 backdrop-blur-md text-emerald-800 ring-1 ring-emerald-600/30 shadow-[0_10px_24px_-10px_rgba(16,185,129,0.28)] hover:bg-[#DFF4E6] focus-visible:outline-emerald-600'
                    : 'bg-[#0071E3] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_28px_-8px_rgba(0,113,227,0.52)] hover:bg-[#0077ED] focus-visible:outline-[#0071E3]'
                }`}
              >
                {!hasJoined && (
                  <span
                    aria-hidden="true"
                    className="support-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/28 to-transparent"
                  />
                )}

                <span className="relative flex items-center justify-center">
                  {hasJoined ? (
                    <Check
                      className="h-[19px] w-[19px] text-emerald-700"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  ) : (
                    <Heart
                      className="h-[18px] w-[18px] fill-white text-white transition-transform duration-200 group-hover:scale-110"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="relative whitespace-nowrap">
                  {isCheckingMember
                    ? 'Checking...'
                    : isSubmitting
                      ? 'Joining...'
                      : hasJoined
                        ? 'You joined'
                        : 'Join Community'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classic Frosted Glass Thank You Popup */}
      <ThankYouModal
        isOpen={showThankYou}
        supportersCount={supportersCount}
        onClose={() => setShowThankYou(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SocialProofApp />
    </ErrorBoundary>
  );
}
