import React from 'react';
import { Mail, Phone, MapPin, User, Briefcase, Star, Award } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { getCountryInfo, getCountryGradient, getCountryBorder, getCountryTextColor } from '../../../../lib/country-utils';

// خريطة الجنسيات إلى أكواد الدول
const nationalityToCountryCode: Record<string, string> = {
  'مصر': 'EG',
  'السعودية': 'SA',
  'الإمارات': 'AE',
  'الكويت': 'KW',
  'قطر': 'QA',
  'البحرين': 'BH',
  'عمان': 'OM',
  'الأردن': 'JO',
  'لبنان': 'LB',
  'سوريا': 'SY',
  'العراق': 'IQ',
  'المغرب': 'MA',
  'الجزائر': 'DZ',
  'تونس': 'TN',
  'ليبيا': 'LY',
  'السودان': 'SD',
  'فلسطين': 'PS',
  'اليمن': 'YE',
  'الهند': 'IN',
  'باكستان': 'PK',
  'بنجلاديش': 'BD',
  'سريلانكا': 'LK',
  'الفلبين': 'PH',
  'إندونيسيا': 'ID',
  'نيبال': 'NP',
  'إثيوبيا': 'ET',
  'كينيا': 'KE',
  'أوغندا': 'UG'
};

// Interfaces and Props
interface CV { 
  id: string;
  fullName: string;
  fullNameArabic?: string;
  email?: string;
  phone?: string;
  referenceCode?: string;
  position?: string;
  nationality?: string;
  religion?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  livingTown?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  weight?: string;
  height?: string;
  age?: number;
  arabicLevel?: string;
  englishLevel?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  passportIssuePlace?: string;
  babySitting?: string;
  childrenCare?: string;
  cleaning?: string;
  washing?: string;
  ironing?: string;
  arabicCooking?: string;
  sewing?: string;
  driving?: string;
  previousEmployment?: string;
  profileImage?: string;
}

interface AlqaeidTemplateProps {
  cv: CV;
}

interface Theme {
  fromColor: string;
  toColor: string;
  accentColor: string;
  accentBg: string;
  flag: string;
}

// Color Themes based on Nationality
const themes: { [key: string]: Theme } = {
  DEFAULT: { fromColor: '#4f46e5', toColor: '#7c3aed', accentColor: '#4f46e5', accentBg: '#eef2ff', flag: '🌐' },
  ETHIOPIAN: { fromColor: '#078930', toColor: '#fde300', accentColor: '#078930', accentBg: '#dcfce7', flag: '🇪🇹' },
  FILIPINO: { fromColor: '#0038a8', toColor: '#ce1126', accentColor: '#0038a8', accentBg: '#dbeafe', flag: '🇵🇭' },
  INDIAN: { fromColor: '#ff9933', toColor: '#138808', accentColor: '#ff9933', accentBg: '#ffedd5', flag: '🇮🇳' },
  BANGLADESHI: { fromColor: '#006a4e', toColor: '#f42a41', accentColor: '#006a4e', accentBg: '#dcfce7', flag: '🇧🇩' },
  KENYAN: { fromColor: '#000000', toColor: '#bb0000', accentColor: '#374151', accentBg: '#e5e7eb', flag: '🇰🇪' },
  UGANDAN: { fromColor: '#000000', toColor: '#fcdc04', accentColor: '#374151', accentBg: '#e5e7eb', flag: '🇺🇬' },
  // Alternative spellings and variations
  ETHIOPIA: { fromColor: '#078930', toColor: '#fde300', accentColor: '#078930', accentBg: '#dcfce7', flag: '🇪🇹' },
  PHILIPPINES: { fromColor: '#0038a8', toColor: '#ce1126', accentColor: '#0038a8', accentBg: '#dbeafe', flag: '🇵🇭' },
  INDIA: { fromColor: '#ff9933', toColor: '#138808', accentColor: '#ff9933', accentBg: '#ffedd5', flag: '🇮🇳' },
  BANGLADESH: { fromColor: '#006a4e', toColor: '#f42a41', accentColor: '#006a4e', accentBg: '#dcfce7', flag: '🇧🇩' },
  KENYA: { fromColor: '#000000', toColor: '#bb0000', accentColor: '#374151', accentBg: '#e5e7eb', flag: '🇰🇪' },
  UGANDA: { fromColor: '#000000', toColor: '#fcdc04', accentColor: '#374151', accentBg: '#e5e7eb', flag: '🇺🇬' },
};

// Helper Components
const Section: React.FC<{ title: string; titleArabic: string; icon: React.ReactNode; theme: Theme; children: React.ReactNode }> = ({ title, titleArabic, icon, theme, children }) => (
  <div className="mb-6 sm:mb-8">
    <div className="flex items-center mb-3 sm:mb-4">
      <div style={{ backgroundColor: theme.accentBg, color: theme.accentColor }} className="rounded-full p-1.5 sm:p-2 mr-2 sm:mr-3">{icon}</div>
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-xs sm:text-sm text-gray-500">{titleArabic}</p>
      </div>
    </div>
    <div className="pl-6 sm:pl-8 lg:pl-12">{children}</div>
  </div>
);

const InfoItem: React.FC<{ label: string; value?: string | number | null | React.ReactNode; }> = ({ label, value }) => (
  <div className="mb-2 sm:mb-0">
    <p className="font-semibold text-gray-600 text-xs sm:text-sm">{label}</p>
    <div className="text-gray-800 font-medium text-sm sm:text-base break-words">{value || 'غير متوفر'}</div>
  </div>
);

const SkillPill: React.FC<{ skill: string; level?: string }> = ({ skill, level }) => {
  const getSkillStatus = (level?: string) => {
    switch (level) {
      case 'YES': return { text: 'نعم', color: 'bg-green-100 text-green-800' };
      case 'WILLING': return { text: 'مستعدة للتعلم', color: 'bg-yellow-100 text-yellow-800' };
      case 'NO': return { text: 'لا', color: 'bg-red-100 text-red-800' };
      default: return { text: 'غير محدد', color: 'bg-gray-100 text-gray-800' };
    }
  };
  const { text, color } = getSkillStatus(level);
  return (
    <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${color}`}>
      <span className="font-medium text-xs sm:text-sm">{skill}</span>
      <span className="font-bold text-xs sm:text-sm">{text}</span>
    </div>
  );
};

// Main CV Template Component
const AlqaeidTemplate: React.FC<AlqaeidTemplateProps> = ({ cv }) => {
  // Get theme based on nationality using country-utils
  const getTheme = (nationality?: string): Theme => {
    if (!nationality) return themes.DEFAULT;
    
    const countryInfo = getCountryInfo(nationality);
    return {
      fromColor: countryInfo.colors.primary,
      toColor: countryInfo.colors.secondary,
      accentColor: countryInfo.colors.primary,
      accentBg: `${countryInfo.colors.primary}20`, // 20% opacity
      flag: countryInfo.flag
    };
  };
  
  const theme = getTheme(cv.nationality);

  const parseEmploymentHistory = (employment?: string) => {
    try {
      return employment ? JSON.parse(employment) : [];
    } catch {
      return [];
    }
  };
  const employmentHistory = parseEmploymentHistory(cv.previousEmployment);

  const getMaritalStatusText = (status?: string) => {
    switch (status) {
      case 'SINGLE': return 'أعزب';
      case 'MARRIED': return 'متزوج';
      case 'DIVORCED': return 'مطلق';
      case 'WIDOWED': return 'أرمل';
      default: return 'غير محدد';
    }
  };

  return (
    <div dir="rtl" className="bg-gray-50 font-cairo">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg my-8 flex flex-col lg:flex-row-reverse">
        
        <div 
          style={{ 
            background: theme.toColor === '#FFFFFF' || theme.toColor === 'white' 
              ? `linear-gradient(135deg, ${theme.fromColor} 0%, ${theme.fromColor}dd 50%, ${theme.fromColor}aa 100%)`
              : `linear-gradient(135deg, ${theme.fromColor} 0%, ${theme.toColor} 100%)`
          }} 
          className="w-full lg:w-1/3 text-white p-4 sm:p-6 lg:p-8 rounded-t-lg lg:rounded-t-none lg:rounded-r-lg flex flex-col items-center text-center shadow-xl"
        >
          {cv.profileImage && (
            <div className="flex flex-col items-center mb-4">
              <img 
                src={cv.profileImage} 
                alt="Profile" 
                className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-cover rounded-full border-4 border-white shadow-lg mb-3"
              />
              <ReactCountryFlag
                countryCode={nationalityToCountryCode[cv.nationality || ''] || 'UN'}
                svg
                style={{
                  width: '45px',
                  height: '34px',
                  borderRadius: '4px',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                title={cv.nationality}
              />
            </div>
          )}
          {!cv.profileImage && (
            <div className="flex flex-col items-center mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white/20 rounded-full border-4 border-white shadow-lg mb-3 flex items-center justify-center">
                <User className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-white/70" />
              </div>
              <ReactCountryFlag
                countryCode={nationalityToCountryCode[cv.nationality || ''] || 'UN'}
                svg
                style={{
                  width: '45px',
                  height: '34px',
                  borderRadius: '4px',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                title={cv.nationality}
              />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">{cv.fullNameArabic || cv.fullName}</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-200 mb-4 sm:mb-6 lg:mb-8">{cv.position || 'مرشح للعمل'}</p>

          <div className="w-full text-right">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold border-b-2 border-opacity-50 border-white pb-2 mb-3 sm:mb-4">معلومات التواصل</h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              {cv.email && <p className="flex items-center break-all"><Mail className="ml-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="truncate">{cv.email}</span></p>}
              {cv.phone && <p className="flex items-center"><Phone className="ml-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> {cv.phone}</p>}
              {cv.livingTown && <p className="flex items-center"><MapPin className="ml-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> {cv.livingTown}</p>}
            </div>
          </div>

          <div className="w-full mt-4 sm:mt-6 lg:mt-8 text-right">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold border-b-2 border-opacity-50 border-white pb-2 mb-3 sm:mb-4">اللغات</h3>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <p>العربية: {cv.arabicLevel || 'غير محدد'}</p>
              <p>الإنجليزية: {cv.englishLevel || 'غير محدد'}</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 p-4 sm:p-6 lg:p-8">
          <Section title="Personal Information" titleArabic="المعلومات الشخصية" icon={<User className="h-5 w-5" />} theme={theme}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-3 sm:gap-y-4">
              <InfoItem label="الاسم الكامل (انجليزي)" value={cv.fullName} />
              <InfoItem 
                label="الجنسية" 
                value={cv.nationality ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl lg:text-2xl">{getCountryInfo(cv.nationality).flag}</span>
                    <span>{cv.nationality}</span>
                  </div>
                ) : null} 
              />
              <InfoItem label="العمر" value={cv.age ? `${cv.age} سنة` : null} />
              <InfoItem label="الديانة" value={cv.religion} />
              <InfoItem label="تاريخ الميلاد" value={cv.dateOfBirth} />
              <InfoItem label="مكان الميلاد" value={cv.placeOfBirth} />
              <InfoItem label="الحالة الاجتماعية" value={getMaritalStatusText(cv.maritalStatus)} />
              <InfoItem label="عدد الأطفال" value={cv.numberOfChildren} />
              <InfoItem label="الوزن" value={cv.weight} />
              <InfoItem label="الطول" value={cv.height} />
            </div>
          </Section>

          <Section title="Passport Details" titleArabic="بيانات جواز السفر" icon={<Briefcase className="h-5 w-5" />} theme={theme}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-3 sm:gap-y-4">
              <InfoItem label="رقم الجواز" value={cv.passportNumber} />
              <InfoItem label="مكان الإصدار" value={cv.passportIssuePlace} />
              <InfoItem label="تاريخ الإصدار" value="-" />
              <InfoItem label="تاريخ الإنتهاء" value={cv.passportExpiryDate} />
            </div>
          </Section>
          
          <Section title="Skills & Experiences" titleArabic="المهارات والخبرات" icon={<Star className="h-5 w-5" />} theme={theme}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <SkillPill skill="التنظيف" level={cv.cleaning} />
              <SkillPill skill="الغسيل" level={cv.washing} />
              <SkillPill skill="الكوي" level={cv.ironing} />
              <SkillPill skill="الطبخ العربي" level={cv.arabicCooking} />
              <SkillPill skill="رعاية الأطفال" level={cv.childrenCare} />
              <SkillPill skill="رعاية الرضع" level={cv.babySitting} />
              <SkillPill skill="الخياطة" level={cv.sewing} />
              <SkillPill skill="القيادة" level={cv.driving} />
            </div>
          </Section>

          {employmentHistory.length > 0 && (
            <Section title="Previous Employment" titleArabic="الخبرة خارج البلاد" icon={<Award className="h-5 w-5" />} theme={theme}>
              <div className="space-y-4">
                {employmentHistory.map((job: any, index: number) => (
                  <div key={index} style={{ borderRight: `4px solid ${theme.accentColor}` }} className="pr-4">
                    <p className="font-bold text-gray-800">{job.position || 'غير محدد'}</p>
                    <p className="text-sm text-gray-600">{job.country || 'غير محدد'} - {job.period || 'غير محدد'}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div className="text-center border-t border-gray-200 pt-4 mt-8">
            <p className="text-xs text-gray-400">
              تم الإنشاء بتاريخ {new Date().toLocaleDateString()} | الكود المرجعي: {cv.referenceCode || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlqaeidTemplate;