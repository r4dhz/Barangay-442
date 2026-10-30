import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  agreeToPrivacy: z.boolean().refine(val => val, 'You must agree to the Data Privacy Policy in accordance with R.A. 10173'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Import authApi here or at the top. Let's just use fetch or import authApi.
      // Wait, we need to import authApi.
      // I will do that in the next tool call if needed, or I can just write it here.
      const { authApi } = await import('../../services/api');
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      // Set token to local storage
      localStorage.setItem('masid_token', res.data.accessToken);
      localStorage.setItem('masid_user', JSON.stringify(res.data.user));
      toast.success('Account created successfully! Welcome to MASID.');
      // Reload to trigger auth context
      window.location.href = '/resident/dashboard';
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Registration failed. Please try again.';
      setError('root', { message: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#14b8a6] flex items-center justify-center">
              <Building2 size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-gray-900 text-xl font-display">MASID</div>
              <div className="text-gray-400 text-xs">Barangay 442 E-Services</div>
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 font-display">Create an Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the MASID resident portal</p>
        </div>

        <div className="card">
          {errors.root && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {errors.root.message}
            </div>
          )}

          <form id="register-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label htmlFor="reg-first-name" className="form-label form-label-required">First Name</label>
                <input
                  id="reg-first-name"
                  type="text"
                  {...register('firstName')}
                  className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
                  placeholder="Juan"
                />
                {errors.firstName && <span className="form-error"><AlertCircle size={12} />{errors.firstName.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="reg-last-name" className="form-label form-label-required">Last Name</label>
                <input
                  id="reg-last-name"
                  type="text"
                  {...register('lastName')}
                  className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
                  placeholder="Dela Cruz"
                />
                {errors.lastName && <span className="form-error"><AlertCircle size={12} />{errors.lastName.message}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label form-label-required">Email Address</label>
              <input
                id="reg-email"
                type="email"
                {...register('email')}
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder="juan@example.com"
                autoComplete="email"
              />
              {errors.email && <span className="form-error"><AlertCircle size={12} />{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label form-label-required">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`form-input pr-11 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {/* Strength Indicators */}
              {password && (
                <div className="flex flex-col gap-1 mt-2">
                  {[
                    { ok: passwordStrength.length, label: 'At least 8 characters' },
                    { ok: passwordStrength.uppercase, label: 'Contains uppercase letter' },
                    { ok: passwordStrength.number, label: 'Contains a number' },
                  ].map((req) => (
                    <div key={req.label} className={`flex items-center gap-1.5 text-xs ${req.ok ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle size={12} className={req.ok ? 'text-green-500' : 'text-gray-300'} />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <span className="form-error"><AlertCircle size={12} />{errors.password.message}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="reg-confirm" className="form-label form-label-required">Confirm Password</label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={`form-input pr-11 ${errors.confirmPassword ? 'form-input-error' : ''}`}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle confirm password visibility">
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="form-error"><AlertCircle size={12} />{errors.confirmPassword.message}</span>}
            </div>

            {/* Data Privacy Agreement (R.A. 10173) */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <input
                id="reg-privacy"
                type="checkbox"
                {...register('agreeToPrivacy')}
                className="w-4 h-4 mt-0.5 rounded accent-[#1e3a8a] cursor-pointer flex-shrink-0"
              />
              <label htmlFor="reg-privacy" className="text-xs text-gray-700 leading-relaxed cursor-pointer">
                I agree to the <span className="font-semibold text-[#1e3a8a]">Barangay 442 Data Privacy Policy</span> in accordance with <span className="font-semibold text-gray-900">R.A. 10173</span> (Data Privacy Act of 2012) and consent to the collection and processing of my personal details for barangay e-services.
              </label>
            </div>
            {errors.agreeToPrivacy && (
              <span className="form-error -mt-2"><AlertCircle size={12} />{errors.agreeToPrivacy.message}</span>
            )}

            <button id="register-submit" type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full mt-1">
              {isLoading ? (
                <><div className="spinner spinner-white w-4 h-4" /> Creating Account...</>
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-5">
          Already have an account?{' '}
          <Link to="/login" id="register-login-link" className="text-[#1e3a8a] font-semibold hover:underline">
            Sign In
          </Link>
        </p>
        <Link to="/" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors">
          ← Back to Public Website
        </Link>
      </div>
    </div>
  );
}
