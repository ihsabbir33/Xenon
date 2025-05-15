import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

import NotificationDetailPage from './pages/NotificationDetailPage';

import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Community Pages
import { UserCommunityDashboard } from './pages/community/UserCommunityDashboard';
import { PostEditor } from './pages/community/PostEditor';
import { PostDetailPage } from './pages/community/PostDetailPage';
import { CreateDoctorArticlePage } from './pages/community/CreateDoctorArticlePage';
import { DoctorArticleDetailPage } from './pages/community/DoctorArticleDetailPage';
import { DoctorArticleDashboard } from './pages/community/DoctorArticleDashboard';
import { EditDoctorArticlePage } from './pages/community/EditDoctorArticlePage';

//

import HealthAuthDashboard from "./pages/healthautorization/HealthAuthDashboard";
import UserAlertDashboard from './pages/UserAlertDashboard';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { PatientSignupSuccessPage } from './pages/auth/PatientSignupSuccessPage';
import { DoctorSignupSuccessPage } from './pages/auth/DoctorSignupSuccessPage';

// User Pages
import { PatientDashboardPage } from './pages/patient/PatientDashboardPage';
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { DoctorAvailabilityPage } from './pages/doctor/DoctorAvailabilityPage';
import { MyAppointmentsPage } from './pages/user/MyAppointmentsPage';
import { MedicalRecordsPage } from './pages/user/MedicalRecordsPage';
import { SettingsPage } from './pages/user/SettingsPage';
import { NotificationsPage } from './pages/user/NotificationsPage';

// Consultation Pages
import { DoctorConsultationPage } from './pages/consultation/DoctorConsultationPage';
import { PatientConsultationPage } from './pages/consultation/PatientConsultationPage';

// General Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { BlogPostPage } from './pages/BlogPostPage';

// Appointment Pages
import { AppointmentPage } from './pages/AppointmentPage';
import { SpecialtySelectionPage } from './pages/SpecialtySelectionPage';
import { DoctorListPage } from './pages/DoctorListPage';
import { DoctorDetailsPage } from './pages/DoctorDetailsPage';
import { BookTelemedicinePage } from './pages/BookTelemedicinePage';
import { PaymentPage } from './pages/PaymentPage';
import { ConfirmationPage } from './pages/ConfirmationPage';

// Hospital Pages
import { HospitalListPage } from './pages/HospitalListPage';
import { DepartmentListPage } from './pages/DepartmentListPage';

// Blood Donation Pages
import { BloodDonationPage } from './pages/BloodDonationPage';
import { BloodDonationPostsPage } from './pages/BloodDonationPostsPage';
import { BloodDonorPage } from './pages/BloodDonorPage';
import { BloodRecipientPage } from './pages/BloodRecipientPage';
import { CreateBloodRequestPage } from './pages/CreateBloodRequestPage';
import { BloodDonationHistoryPage } from './pages/BloodDonationHistoryPage';
import { BloodDonorConfirmationPage } from './pages/BloodDonorConfirmationPage';
import { BloodRecipientConfirmationPage } from './pages/BloodRecipientConfirmationPage';
import { BloodRequestConfirmationPage } from './pages/BloodRequestConfirmationPage';
import { BloodDonationPostPage } from './pages/BloodDonationPostPage';
import { BloodDonorsPage } from './pages/BloodDonorsPage';

// Ambulance Pages
import { AmbulanceServicePage } from './pages/AmbulanceServicePage';
import { AmbulanceListPage } from './pages/AmbulanceListPage';
import { AmbulanceDetailsPage } from './pages/AmbulanceDetailsPage';
import { AmbulanceDashboardPage } from './pages/AmbulanceDashboardPage';

// Medicine and Pharmacy Pages
import { FindPharmaciesPage } from './pages/FindPharmaciesPage';
import { MedicinePage } from './pages/medicine/MedicinePage';
import { PharmacyListPage } from './pages/medicine/PharmacyListPage';
import { PharmacyDetailsPage } from './pages/medicine/PharmacyDetailsPage';
import { MedicineSearchPage } from './pages/medicine/MedicineSearchPage';
import { CartPage } from './pages/medicine/CartPage';
import { MedicineCheckoutPage } from './pages/medicine/MedicineCheckoutPage';
import { MedicineConfirmationPage } from './pages/medicine/MedicineConfirmationPage';
import { PharmacyDashboardPage } from './pages/pharmacy/PharmacyDashboardPage';

function App() {
  return (
      <Router>
        {/*<Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 3000,
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                },
              },
            }}
        />*/}

        <div className="min-h-screen bg-white flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* General Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog/:id" element={<BlogPostPage />} />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/signup/patient/success" element={<PatientSignupSuccessPage />} />
              <Route path="/signup/doctor/success" element={<DoctorSignupSuccessPage />} />

              {/* Protected Routes */}
              <Route path="/health-authorization" element={
                <ProtectedRoute allowedRoles={['HEALTH_AUTHORIZATION']}>
                  <HealthAuthDashboard />
                </ProtectedRoute>
              } />

              <Route path="/alerts" element={
                <ProtectedRoute>
                  <UserAlertDashboard />
                </ProtectedRoute>
              } />

              <Route path="/alerts/:id" element={
                <ProtectedRoute>
                  <NotificationDetailPage />
                </ProtectedRoute>
              } />

              <Route path="/notifications/:id" element={
                <ProtectedRoute>
                  <NotificationDetailPage />
                </ProtectedRoute>
              } />

              {/* User Routes */}
              <Route path="/patient/dashboard" element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <PatientDashboardPage />
                </ProtectedRoute>
              } />

              <Route path="/doctor/dashboard" element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorDashboardPage />
                </ProtectedRoute>
              } />

              <Route path="/doctor/availability" element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorAvailabilityPage />
                </ProtectedRoute>
              } />

              <Route path="/appointments" element={
                <ProtectedRoute>
                  <MyAppointmentsPage />
                </ProtectedRoute>
              } />

              <Route path="/records" element={
                <ProtectedRoute>
                  <MedicalRecordsPage />
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />

              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />

              {/* Consultation Routes */}
              <Route path="/consultation/doctor/:appointmentId" element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <DoctorConsultationPage />
                </ProtectedRoute>
              } />

              <Route path="/consultation/patient/:appointmentId" element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <PatientConsultationPage />
                </ProtectedRoute>
              } />

              {/* Community Routes */}
              <Route path="/community/users" element={
                <ProtectedRoute>
                  <UserCommunityDashboard />
                </ProtectedRoute>
              } />

              <Route path="/community/users/create" element={
                <ProtectedRoute>
                  <PostEditor />
                </ProtectedRoute>
              } />

              <Route path="/community/users/post/:id" element={
                <ProtectedRoute>
                  <PostDetailPage />
                </ProtectedRoute>
              } />

              <Route path="/community/users/edit/:id" element={
                <ProtectedRoute>
                  <PostEditor />
                </ProtectedRoute>
              } />

              <Route path="/community/doctors" element={
                <ProtectedRoute>
                  <DoctorArticleDashboard />
                </ProtectedRoute>
              } />

              <Route path="/community/doctors/create" element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <CreateDoctorArticlePage />
                </ProtectedRoute>
              } />

              <Route path="/community/doctors/article/:id" element={
                <ProtectedRoute>
                  <DoctorArticleDetailPage />
                </ProtectedRoute>
              } />

              <Route path="/community/doctors/edit/:id" element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <EditDoctorArticlePage />
                </ProtectedRoute>
              } />

              {/* Remaining routes (simplified - add ProtectedRoute where needed) */}
              <Route path="/appointment" element={<AppointmentPage />} />
              <Route path="/appointment/:type" element={<SpecialtySelectionPage />} />
              <Route path="/appointment/:type/:specialty/doctors" element={<DoctorListPage />} />
              <Route path="/appointment/:type/:specialty/doctor/:id" element={<DoctorDetailsPage />} />
              <Route path="/appointment/:type/:specialty/doctor/:id/book" element={<BookTelemedicinePage />} />
              <Route path="/appointment/:type/:specialty/doctor/:id/payment" element={<PaymentPage />} />
              <Route path="/appointment/:type/:specialty/doctor/:id/confirmation" element={<ConfirmationPage />} />

              {/* Hospital Routes */}
              <Route path="/hospitals" element={<HospitalListPage />} />
              <Route path="/hospitals/:hospitalId/departments" element={<DepartmentListPage />} />
              <Route path="/hospitals/:hospitalId/departments/:departmentId/doctors" element={<DoctorListPage />} />
              <Route path="/hospitals/:hospitalId/departments/:departmentId/doctor/:id" element={<DoctorDetailsPage />} />
              <Route path="/hospitals/:hospitalId/departments/:departmentId/doctor/:id/book" element={<BookTelemedicinePage />} />
              <Route path="/hospitals/:hospitalId/departments/:departmentId/doctor/:id/payment" element={<PaymentPage />} />
              <Route path="/hospitals/:hospitalId/departments/:departmentId/doctor/:id/confirmation" element={<ConfirmationPage />} />

              {/* Blood Donation Routes */}
              <Route path="/blood-donation" element={<BloodDonationPage />} />
              <Route path="/blood-donation/posts" element={<BloodDonationPostsPage />} />
              <Route path="/blood-donation/donor" element={<BloodDonorPage />} />
              <Route path="/blood-donation/donor/confirmation" element={<BloodDonorConfirmationPage />} />
              <Route path="/blood-donation/recipient" element={<BloodRecipientPage />} />
              <Route path="/blood-donation/recipient/confirmation" element={<BloodRecipientConfirmationPage />} />
              <Route path="/blood-donation/create-post" element={<CreateBloodRequestPage />} />
              <Route path="/blood-donation/create-post/confirmation" element={<BloodRequestConfirmationPage />} />
              <Route path="/blood-donation/history" element={<BloodDonationHistoryPage />} />
              <Route path="/blood-donation/post/:id" element={<BloodDonationPostPage />} />
              <Route path="/blood-donation/donors" element={<BloodDonorsPage />} />

              {/* Ambulance Routes */}
              <Route path="/ambulance" element={<AmbulanceServicePage />} />
              <Route path="/ambulance/list/:type" element={<AmbulanceListPage />} />
              <Route path="/ambulance/details/:id" element={<AmbulanceDetailsPage />} />
              <Route path="/ambulance/book/:type" element={<AmbulanceListPage />} />
              <Route path="/ambulance-dashboard" element={
                <ProtectedRoute allowedRoles={['AMBULANCE']}>
                  <AmbulanceDashboardPage />
                </ProtectedRoute>
              } />

              {/* Pharmacy Routes */}
              <Route path="/find-pharmacies" element={<FindPharmaciesPage />} />
              <Route path="/pharmacy/dashboard" element={
                <ProtectedRoute allowedRoles={['PHARMACY']}>
                  <PharmacyDashboardPage />
                </ProtectedRoute>
              } />

              {/* Medicine Routes */}
              <Route path="/medicine" element={<MedicinePage />} />
              <Route path="/medicine/pharmacies" element={<PharmacyListPage />} />
              <Route path="/medicine/pharmacies/:id" element={<PharmacyDetailsPage />} />
              <Route path="/medicine/search" element={<MedicineSearchPage />} />
              <Route path="/medicine/cart" element={<CartPage />} />
              <Route path="/medicine/checkout" element={<MedicineCheckoutPage />} />
              <Route path="/medicine/confirmation" element={<MedicineConfirmationPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
  );
}

export default App;