"use client";
import Link from 'next/link'
import PublicHeader from '../_components/PublicHeader';
import PublicFooter from '../_components/PublicFooter';

export default function IntegratedPricingPage() {
 

  const coinPackages = [
    { 
      coins: 2000, 
      price: "Kes. 400", 
      popular: false,
      features: [
        "Limited to 2,000 contacts",
        "Standard support",
        "Valid for 30 days"
      ]
    },
    { 
      coins: 6000, 
      price: "Kes. 1,000", 
      popular: true, 
      bonus: 50,
      features: [
        "Limited to 2,000 contacts",
        "Priority support",
        "Valid for 30 days",
        "+50 Bonus coins"
      ]
    },
    { 
      coins: 10000, 
      price: "Kes. 1,700", 
      popular: false, 
      bonus: 150,
      features: [
        "Limited to 2,000 contacts",
        "24/7 Premium support",
        "Valid for 30 days",
        "+150 Bonus coins"
      ]
    },
    { 
      coins: "Custom", 
      popular: false, 
      price: "Contact Support",
      isCustom: true,
      features: [
        "Unlimited contacts",
        "Dedicated support",
        "Custom validity period",
        "Negotiable pricing"
      ]
    },
  ];


  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-slate-900 relative overflow-hidden">
      <PublicHeader />
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-100 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-purple-100 to-transparent"></div>
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 mt-10">
        {/* Header Section */}
        <header className="mb-16 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full shadow-lg">
            Pricing & Features
          </div>
          <h1 className="text-5xl font-extrabold leading-tight bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Everything You Need to Succeed
          </h1>
          <p className="mt-4 text-lg text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Choose the perfect package for your email campaign needs. Pay only for what you use with our flexible coin system.
          </p>
        </header>

        {/* Pricing Packages Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Choose Your Package</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Simple, transparent pricing. 1 coin = 1 email. No hidden fees, no subscriptions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coinPackages.map((pkg, index) => (
              <div
                key={index}
                className={`relative border-2 rounded-2xl p-6 transition-all duration-300 ${
                  pkg.popular
                    ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-2xl scale-105'
                    : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-xl'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    {pkg.isCustom ? (
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <p className="text-5xl font-bold text-gray-800 mb-2">
                    {typeof pkg.coins === 'number' ? pkg.coins.toLocaleString() : pkg.coins}
                  </p>
                  <p className="text-sm text-gray-600 mb-4 font-medium uppercase tracking-wide">
                    {pkg.isCustom ? 'Package' : 'coins'}
                  </p>
                  
                  {pkg.bonus && (
                    <div className="mb-4">
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                        +{pkg.bonus} BONUS
                      </span>
                    </div>
                  )}
                  
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6">
                    {pkg.price}
                  </p>

                  <div className="text-left mb-6 space-y-3 min-h-[140px]">
                    {pkg.features?.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How Coins Work */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 mb-16 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            How Coins Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="bg-blue-500 rounded-full p-3 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg mb-1">1 Email = 1 Coin</p>
                <p className="text-sm text-gray-600">Each email sent costs 1 coin from your balance</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="bg-green-500 rounded-full p-3 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg mb-1">Bulk Discounts</p>
                <p className="text-sm text-gray-600">Get bonus coins on larger packages</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="bg-purple-500 rounded-full p-3 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg mb-1">No Expiry</p>
                <p className="text-sm text-gray-600">Your coins never expire, use them anytime</p>
              </div>
            </div>
          </div>
        </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-50/80 to-white/80 backdrop-blur-sm p-10 rounded-3xl border-2 border-slate-200 shadow-xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Experience These Features?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Start your free trial today and see why thousands of teams trust Bulky for their email campaigns.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                Start Now
              </Link>
            </div>
          </div>
      </div>

      <PublicFooter />
    
    </main>
  )
}