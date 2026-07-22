const CF_CONFIG = Object.freeze({
  supabaseUrl: "https://jjfnuqwjucqirmrgfjne.supabase.co",
  supabasePublishableKey: "sb_publishable_MyVpSs485ZeYs31LtNo8RQ_5pjRTB79",

  whatsappNumber: "628116946999",
  initialConsultationCredit: 2,
  consultationPrice: 99000,

  directPaidServices: {
    "review-polis": 499000,
    "financial-checkup": 499000
  },

  payments: {
    paymentDeadlineHours: 24,
    banks: [
      {
        id: "bca",
        bankName: "Bank Central Asia (BCA)",
        accountNumber: "8520187074",
        accountHolder: "SEPTINO",
        isDefault: true,
        isActive: true
      },
      {
        id: "bni",
        bankName: "Bank Negara Indonesia (BNI)",
        accountNumber: "3113131377",
        accountHolder: "SEPTINO",
        isDefault: false,
        isActive: true
      }
    ]
  }
});

window.CF_CONFIG = CF_CONFIG;
window.SEPTINO_APP_CONFIG = CF_CONFIG;
