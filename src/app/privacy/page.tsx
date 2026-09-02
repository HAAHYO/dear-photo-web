import Header from "@/widgets/Header";
import Footer from "@/widgets/Footer";

const SECTIONS = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: "회원가입 시 이메일, 비밀번호(암호화 저장), 닉네임을 수집합니다. 서비스 이용 과정에서 촬영한 사진과 다이어리에 남긴 글은 회원이 직접 입력한 콘텐츠로 저장됩니다.",
  },
  {
    title: "2. 개인정보의 이용 목적",
    body: "회원 식별 및 로그인 유지, 다이어리 저장/조회 등 서비스 제공, 문의 응대를 위해서만 이용합니다. 목적 외 용도로 이용하거나 제3자에게 제공하지 않습니다.",
  },
  {
    title: "3. 보유 및 이용 기간",
    body: "회원 탈퇴 시 관련 개인정보와 저장된 사진·다이어리는 지체 없이 파기합니다. 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안만 별도로 보관합니다.",
  },
  {
    title: "4. 이용자의 권리",
    body: "이용자는 마이페이지에서 언제든지 본인의 정보를 확인하거나 회원 탈퇴를 통해 삭제를 요청할 수 있습니다.",
  },
  {
    title: "5. 문의처",
    body: "개인정보 처리와 관련한 문의사항은 서비스 내 고객센터 또는 이메일로 접수해주세요.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="mail-dot-bg flex min-h-screen flex-col">
      <Header />

      <section className="flex flex-1 flex-col gap-6 px-5 py-8 sm:px-8 sm:py-11 lg:px-14">
        <h1 className="text-[26px] font-extrabold">📮 개인정보처리방침</h1>

        <div className="airmail-frame mx-auto w-full max-w-3xl shadow-md">
          <div className="flex flex-col gap-6 bg-surface p-6 sm:p-9">
            <p className="text-sm leading-relaxed text-ink-soft">
              Dear, Photo(이하 &quot;서비스&quot;)는 이용자의 개인정보를 소중히 다루며, 관련 법령을
              준수합니다. 본 방침은 서비스가 어떤 정보를 수집하고 어떻게 이용·보관하는지 안내합니다.
            </p>

            {SECTIONS.map((section) => (
              <div key={section.title} className="border-t border-dashed border-line pt-5 first:border-none first:pt-0">
                <h2 className="font-extrabold">{section.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{section.body}</p>
              </div>
            ))}

            <p className="text-xs text-ink-faint">시행일자: 2026년 9월 2일</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
