import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Package, Calendar, Megaphone, FileText, Phone,
  ArrowRight, MapPin, Clock, CheckCircle, ChevronRight,
  Users, TrendingUp, Shield, Zap, Star, ExternalLink
} from 'lucide-react';
import { PublicNavbar, PublicFooter } from '../../components/layout/PublicLayout';
import { announcementsApi, eventsApi, payoutSchedulesApi } from '../../services/api';
import type { Announcement, BarangayEvent, PayoutSchedule } from '../../types';
import { format, parseISO } from 'date-fns';

// ---- Service Card ----
const services = [
  {
    id: 'payouts',
    icon: Wallet,
    title: 'Payout Assistance',
    description: 'View payout schedules and assistance information for qualified beneficiaries.',
    link: '/payouts',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'resources',
    icon: Package,
    title: 'Resource Assistance',
    description: 'View available assistance programs and resource distribution information.',
    link: '/resources',
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    id: 'events',
    icon: Calendar,
    title: 'Events',
    description: 'Discover upcoming barangay activities and community events.',
    link: '/events',
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    id: 'announcements',
    icon: Megaphone,
    title: 'Announcements',
    description: 'Stay updated with important barangay announcements and news.',
    link: '/announcements',
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    id: 'information',
    icon: FileText,
    title: 'Request Information',
    description: 'Access important public barangay information and documents.',
    link: '/services',
    color: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    id: 'contact',
    icon: Phone,
    title: 'Contact Barangay',
    description: 'Get in touch with barangay personnel for assistance.',
    link: '/contact',
    color: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
];

const categoryColors: Record<string, string> = {
  health: 'badge-success',
  community: 'badge-primary',
  emergency: 'badge-error',
  livelihood: 'badge-secondary',
  general: 'badge-gray',
  youth: 'badge-info',
  senior: 'badge-warning',
  environmental: 'badge-secondary',
};

const eventCategoryIcons: Record<string, string> = {
  assembly: '🏛️',
  health: '🏥',
  sports: '⚽',
  youth: '🎓',
  senior: '👴',
  livelihood: '💼',
  environmental: '🌿',
  cultural: '🎭',
  other: '📌',
};

const payoutStatusColors: Record<string, string> = {
  scheduled: 'badge-info',
  ongoing: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-error',
};

// Demo data (shown when backend isn't connected yet)
const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: 'Barangay Clean-Up Drive - August 2026',
    category: 'community',
    content: '',
    shortDescription: 'Residents are encouraged to participate in the upcoming community clean-up drive scheduled on August 15, 2026.',
    authorId: 1,
    status: 'published',
    publishedAt: '2026-08-01T08:00:00Z',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 2,
    title: 'Free Medical Mission - August 2026',
    category: 'health',
    content: '',
    shortDescription: 'Free medical and dental services for all Barangay 442 residents. Bring your barangay ID.',
    authorId: 1,
    status: 'published',
    publishedAt: '2026-08-05T09:00:00Z',
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-05T09:00:00Z',
  },
  {
    id: 3,
    title: 'Barangay Assembly - August 28, 2026',
    category: 'community',
    content: '',
    shortDescription: 'Attend the 3rd Quarter Barangay Assembly on August 28, 2026 at Barangay 442 Hall.',
    authorId: 1,
    status: 'published',
    publishedAt: '2026-08-08T07:00:00Z',
    createdAt: '2026-08-08T07:00:00Z',
    updatedAt: '2026-08-08T07:00:00Z',
  },
];

const DEMO_EVENTS: BarangayEvent[] = [
  {
    id: 1,
    title: 'Barangay Assembly - 3rd Quarter 2026',
    description: 'Quarterly barangay assembly open to all residents.',
    eventDate: '2026-08-28',
    startTime: '09:00:00',
    endTime: '12:00:00',
    location: 'Barangay 442 Hall, Sampaloc, Manila',
    category: 'assembly',
    status: 'published',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    title: 'Libre Medical Mission',
    description: 'Free medical services for all residents.',
    eventDate: '2026-08-18',
    startTime: '07:00:00',
    endTime: '17:00:00',
    location: 'Barangay 442 Health Center',
    category: 'health',
    status: 'published',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 3,
    title: 'Youth Sports Festival 2026',
    description: 'Annual sports event for the youth.',
    eventDate: '2026-09-05',
    startTime: '08:00:00',
    location: 'Sampaloc Sports Complex',
    category: 'sports',
    status: 'published',
    createdAt: '',
    updatedAt: '',
  },
];

const DEMO_PAYOUTS: PayoutSchedule[] = [
  {
    id: 1,
    programId: 1,
    name: 'August 2026 Senior Citizen Payout',
    scheduleDate: '2026-08-20',
    startTime: '08:00:00',
    endTime: '16:00:00',
    location: 'Barangay 442 Hall, Sampaloc, Manila',
    notes: 'Bring valid ID and senior citizen card',
    status: 'scheduled',
    isPublic: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    programId: 2,
    name: '4Ps August 2026 Supplement',
    scheduleDate: '2026-08-22',
    startTime: '09:00:00',
    endTime: '15:00:00',
    location: 'Barangay 442 Hall, Sampaloc, Manila',
    notes: 'Bring 4Ps ID and barangay clearance',
    status: 'scheduled',
    isPublic: true,
    createdAt: '',
    updatedAt: '',
  },
];

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string) {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m);
    return format(d, 'h:mm a');
  } catch {
    return timeStr;
  }
}

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEMO_ANNOUNCEMENTS);
  const [events, setEvents] = useState<BarangayEvent[]>(DEMO_EVENTS);
  const [payouts, setPayouts] = useState<PayoutSchedule[]>(DEMO_PAYOUTS);

  useEffect(() => {
    // Try to load from API, fall back to demo data
    announcementsApi.getPublished({ limit: 3 })
      .then(r => { if (r.data?.data?.length) setAnnouncements(r.data.data); })
      .catch(() => {});
    eventsApi.getPublished({ limit: 3 })
      .then(r => { if (r.data?.data?.length) setEvents(r.data.data); })
      .catch(() => {});
    payoutSchedulesApi.getPublic({ limit: 2 })
      .then(r => { if (r.data?.data?.length) setPayouts(r.data.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* ---- HERO ---- */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0d9488 100%)',
          minHeight: '580px',
        }}
        aria-label="Hero section"
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

        <div className="page-container relative z-10 py-20 lg:py-28">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-6">
              <Shield size={14} className="text-teal-300" />
              Official Barangay 442, Sampaloc, Manila
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight font-display mb-5">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-300">
                MASID
              </span>{' '}
              E-Services
            </h1>

            <p className="text-lg lg:text-xl text-white/75 leading-relaxed mb-8 max-w-2xl">
              Accessible, transparent, and convenient digital services for our barangay community.
              Manage payouts, resources, events, and stay informed.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/services"
                id="hero-explore-btn"
                className="btn btn-secondary btn-lg"
              >
                Explore Services
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/announcements"
                id="hero-announcements-btn"
                className="btn btn-outline-white btn-lg"
              >
                View Announcements
              </Link>
            </div>

            {/* Stats Row */}
            <div className="mt-12 flex flex-wrap gap-6">
              {[
                { label: 'Active Beneficiaries', value: '250+', icon: Users },
                { label: 'Programs Running', value: '5', icon: TrendingUp },
                { label: 'Events This Month', value: '6', icon: Calendar },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <stat.icon size={18} className="text-teal-300" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg leading-tight">{stat.value}</div>
                    <div className="text-white/60 text-xs">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ---- SERVICES ---- */}
      <section id="services" className="py-16 lg:py-24 bg-white" aria-label="Barangay services">
        <div className="page-container">
          <div className="section-header">
            <div className="section-tag">
              <Zap size={14} />
              Digital Services
            </div>
            <h2 className="section-title">Barangay Services</h2>
            <p className="section-subtitle">
              Access all essential barangay services online — conveniently, securely, and transparently.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => (
              <Link
                key={service.id}
                to={service.link}
                id={`service-card-${service.id}`}
                className="group card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl ${service.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon size={22} className={service.iconColor} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#1e3a8a] transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{service.description}</p>
                <div className="mt-4 flex items-center gap-1 text-[#1e3a8a] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn More <ChevronRight size={15} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- ANNOUNCEMENTS ---- */}
      <section id="announcements" className="py-16 lg:py-24 bg-gray-50" aria-label="Latest announcements">
        <div className="page-container">
          <div className="section-header">
            <div className="section-tag">
              <Megaphone size={14} />
              Stay Informed
            </div>
            <h2 className="section-title">Latest Announcements</h2>
            <p className="section-subtitle">
              Important updates and news from Barangay 442 officials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {announcements.map((a) => (
              <Link
                key={a.id}
                to={`/announcements/${a.id}`}
                id={`announcement-card-${a.id}`}
                className="card group flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${categoryColors[a.category] ?? 'badge-gray'} capitalize`}>
                    {a.category.replace('_', ' ')}
                  </span>
                  {a.publishedAt && (
                    <span className="text-xs text-gray-400">{formatDate(a.publishedAt)}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-[#1e3a8a] transition-colors truncate-2">
                  {a.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 truncate-3">
                  {a.shortDescription || 'Read the full announcement for details.'}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-[#1e3a8a] text-sm font-semibold">
                  Read More <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/announcements" id="view-all-announcements" className="btn btn-outline btn-lg">
              View All Announcements
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---- EVENTS ---- */}
      <section id="events" className="py-16 lg:py-24 bg-white" aria-label="Upcoming events">
        <div className="page-container">
          <div className="section-header">
            <div className="section-tag">
              <Calendar size={14} />
              Community Events
            </div>
            <h2 className="section-title">Upcoming Events</h2>
            <p className="section-subtitle">
              Join community activities and stay connected with Barangay 442.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                id={`event-card-${event.id}`}
                className="card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Event date badge */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#14b8a6] rounded-xl flex flex-col items-center justify-center text-white">
                    <span className="text-xs font-semibold opacity-80">
                      {format(parseISO(event.eventDate), 'MMM')}
                    </span>
                    <span className="text-xl font-extrabold leading-tight">
                      {format(parseISO(event.eventDate), 'd')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl mb-1">{eventCategoryIcons[event.category] ?? '📌'}</div>
                    <h3 className="font-bold text-gray-900 text-base group-hover:text-[#1e3a8a] transition-colors truncate-2">
                      {event.title}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="flex-shrink-0 text-teal-500" />
                    <span>{formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="flex-shrink-0 text-teal-500" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                {event.description && (
                  <p className="mt-3 text-sm text-gray-400 truncate-2">{event.description}</p>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-[#1e3a8a] text-sm font-semibold">
                  View Details <ChevronRight size={15} />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/events" id="view-all-events" className="btn btn-outline btn-lg">
              View All Events
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---- PUBLIC PAYOUTS ---- */}
      <section id="payouts" className="py-16 lg:py-24 bg-gray-50" aria-label="Upcoming payouts">
        <div className="page-container">
          <div className="section-header">
            <div className="section-tag">
              <Wallet size={14} />
              Assistance Programs
            </div>
            <h2 className="section-title">Upcoming Payouts</h2>
            <p className="section-subtitle">
              View the schedule for upcoming payout distributions. Bring valid ID and qualifying documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                id={`payout-card-${payout.id}`}
                className="card border-l-4 border-l-[#1e3a8a]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-gray-900 text-base">{payout.name}</h3>
                  <span className={`badge ${payoutStatusColors[payout.status]} capitalize flex-shrink-0`}>
                    {payout.status}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#1e3a8a] flex-shrink-0" />
                    <span>{formatDate(payout.scheduleDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#1e3a8a] flex-shrink-0" />
                    <span>{formatTime(payout.startTime)} – {formatTime(payout.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#1e3a8a] flex-shrink-0" />
                    <span>{payout.location}</span>
                  </div>
                </div>

                {payout.notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                    <strong>Note:</strong> {payout.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/payouts" id="view-all-payouts" className="btn btn-outline btn-lg">
              View All Payout Schedules
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ---- ABOUT MASID ---- */}
      <section id="about" className="py-16 lg:py-24 bg-white" aria-label="About MASID">
        <div className="page-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="section-tag mb-4">
                <Star size={14} />
                About the System
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 font-display mb-5">
                What is MASID?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-base">
                <strong>MASID</strong> — Monitoring and Administration System for Integrated Delivery — is an 
                integrated Barangay E-Services management platform developed specifically for 
                <strong> Barangay 442, Sampaloc, Manila</strong>.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8 text-base">
                It centralizes payout management, beneficiary records, resource distribution, 
                community events, and announcements — improving transparency, efficiency, and 
                accessibility of barangay services for all residents.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  { label: 'Efficiency', desc: 'Streamlined processes reduce paperwork and processing time' },
                  { label: 'Transparency', desc: 'Complete audit trail of all transactions and actions' },
                  { label: 'Accessibility', desc: 'Services available online 24/7 for all residents' },
                  { label: 'Accountability', desc: 'Role-based access ensures data integrity and security' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-teal-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">{item.label}:</span>{' '}
                      <span className="text-gray-600 text-sm">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Wallet,
                  title: 'Payout Management',
                  desc: 'Manage payout programs, schedules, and transaction records efficiently.',
                  color: 'bg-blue-50',
                  iconColor: 'text-blue-600',
                },
                {
                  icon: Package,
                  title: 'Resource Distribution',
                  desc: 'Track inventory and record resource distributions to beneficiaries.',
                  color: 'bg-teal-50',
                  iconColor: 'text-teal-600',
                },
                {
                  icon: Users,
                  title: 'Beneficiary Records',
                  desc: 'Maintain secure and organized records of all qualified beneficiaries.',
                  color: 'bg-violet-50',
                  iconColor: 'text-violet-600',
                },
                {
                  icon: FileText,
                  title: 'Community Information',
                  desc: 'Publish and manage announcements and events for the community.',
                  color: 'bg-amber-50',
                  iconColor: 'text-amber-600',
                },
              ].map((feature) => (
                <div key={feature.title} className="card card-compact">
                  <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center mb-3`}>
                    <feature.icon size={19} className={feature.iconColor} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{feature.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- CTA BANNER ---- */}
      <section className="py-14" aria-label="Call to action">
        <div className="page-container">
          <div
            className="rounded-2xl p-8 lg:p-12 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)' }}
          >
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='2'/%3E%3Ccircle cx='13' cy='13' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <div className="relative z-10">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white font-display mb-3">
                Register and Access Your Services Online
              </h2>
              <p className="text-white/75 text-base mb-6 max-w-lg mx-auto">
                Create a MASID account to access your resident dashboard with the latest barangay announcements, upcoming events, and payout schedules.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/register" id="cta-register-btn" className="btn btn-secondary btn-lg">
                  Create an Account
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" id="cta-login-btn" className="btn btn-outline-white btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
