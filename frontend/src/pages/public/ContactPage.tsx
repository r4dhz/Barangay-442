import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MapPin, Phone, Mail, Clock, Building2, Send, MessageSquare, Loader2 } from 'lucide-react';
import { PublicNavbar, PublicFooter } from '../../components/layout/PublicLayout';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    try {
      const formData = new FormData(form);
      const payload = {
        access_key: 'fbb794a4-0893-45ae-b6bd-13f8e3455715',
        name: `${formData.get('firstName') ?? ''} ${formData.get('lastName') ?? ''}`.trim(),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
      };

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Salamat! Naipadala na ang iyong mensahe sa Barangay.');
        form.reset();
      } else {
        toast.error('May nangyaring error. Pakisubukang muli.');
        console.error('Web3Forms error:', result);
      }
    } catch (err) {
      toast.error('May nangyaring error. Pakisubukang muli.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <div className="page-container py-12 lg:py-20">
        <div className="section-header">
          <div className="section-tag"><MessageSquare size={14} />Get in Touch</div>
          <h1 className="section-title">Contact Barangay 442</h1>
          <p className="section-subtitle">Have questions or concerns? Reach out to Barangay 442, Zone 44 personnel.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div>
            <div className="card mb-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#14b8a6] flex items-center justify-center"><Building2 size={24} className="text-white" /></div>
                <div>
                  <h2 className="font-extrabold text-gray-900 text-lg font-display">Barangay 442 Office</h2>
                  <p className="text-gray-500 text-sm">Zone 44, Sampaloc, Manila</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { icon: MapPin, label: 'Address', value: 'Barangay 442, Zone 44, Sampaloc, Manila, Philippines' },
                  { icon: Phone, label: 'Phone', value: '+63 2 8XXX-XXXX' },
                  { icon: Mail, label: 'Email', value: 'barangay442@gmail.com' },
                  { icon: Clock, label: 'Office Hours', value: 'Monday to Friday, 8:00 AM – 5:00 PM' },
                ].map(info => (
                  <div key={info.label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <info.icon size={16} className="text-[#1e3a8a]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{info.label}</p>
                      <p className="text-sm text-gray-800 font-medium">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">For emergencies,</span> please call the barangay hotline directly or visit the Barangay Hall during office hours.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Send a Message</h2>
            <form id="contact-form" className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label form-label-required">First Name</label>
                  <input type="text" name="firstName" className="form-input" placeholder="Juan" required />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required">Last Name</label>
                  <input type="text" name="lastName" className="form-input" placeholder="Dela Cruz" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">Email Address</label>
                <input type="email" name="email" className="form-input" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" className="form-input" placeholder="09XX XXX XXXX" />
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">Subject</label>
                <select name="subject" className="form-input" required>
                  <option value="">Select a subject...</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Assistance Request">Assistance Request</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Suggestion">Suggestion</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">Message</label>
                <textarea name="message" className="form-input" rows={4} placeholder="Write your message here..." required />
              </div>
              <button id="contact-submit-btn" type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
