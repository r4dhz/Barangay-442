import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Package, Calendar, Megaphone, FileText, Phone, MapPin, Clock, ArrowRight, Zap } from 'lucide-react';
import { PublicNavbar, PublicFooter } from '../../components/layout/PublicLayout';

const services = [
  { id: 'payouts', icon: Wallet, title: 'Payout Assistance', description: 'View upcoming payout schedules and assistance programs for qualified beneficiaries. View upcoming payout schedules, venues, and requirements for assistance programs.', link: '/payouts', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { id: 'resources', icon: Package, title: 'Resource Assistance', description: 'Learn about available assistance programs including food packs, medicine, hygiene kits, and other resources distributed by the barangay.', link: '/resources', bg: 'bg-teal-50', iconColor: 'text-teal-600' },
  { id: 'events', icon: Calendar, title: 'Barangay Events', description: 'Discover community activities including assemblies, medical missions, sports festivals, livelihood trainings, and more.', link: '/events', bg: 'bg-violet-50', iconColor: 'text-violet-600' },
  { id: 'announcements', icon: Megaphone, title: 'Announcements', description: 'Stay updated with important barangay announcements, emergency advisories, community news, and official notices.', link: '/announcements', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { id: 'information', icon: FileText, title: 'Public Information', description: 'Access public barangay information, directories, and important documents available for community use.', link: '/about', bg: 'bg-green-50', iconColor: 'text-green-600' },
  { id: 'contact', icon: Phone, title: 'Contact Barangay', description: 'Get in touch with Barangay 442 personnel for assistance, inquiries, and emergency concerns.', link: '/contact', bg: 'bg-rose-50', iconColor: 'text-rose-600' },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <div className="page-container py-12 lg:py-20">
        <div className="section-header">
          <div className="section-tag"><Zap size={14} />Digital Services</div>
          <h1 className="section-title">Barangay Services</h1>
          <p className="section-subtitle">All essential digital services available for residents of Barangay 442, Zone 44, Sampaloc, Manila.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map(s => (
            <Link key={s.id} to={s.link} id={`service-${s.id}`} className="card group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
              <div className={`w-14 h-14 rounded-xl ${s.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <s.icon size={26} className={s.iconColor} />
              </div>
              <h2 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#1e3a8a] transition-colors">{s.title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">{s.description}</p>
              <div className="mt-4 flex items-center gap-1 text-[#1e3a8a] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn More <ArrowRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
