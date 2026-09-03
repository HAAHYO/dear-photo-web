import Header from "@/widgets/Header";
import Footer from "@/widgets/Footer";

const SECTIONS = [
  {
    title: "제1조 (목적)",
    body: "본 약관은 Dear, Photo(이하 \"서비스\")가 제공하는 포토부스 촬영 및 다이어리 저장 서비스의 이용 조건과 절차를 정하는 것을 목적으로 합니다.",
  },
  {
    title: "제2조 (서비스의 제공)",
    body: "서비스는 컨셉 선택, 네컷 촬영, 스티커·드로잉 편집, 사진 다운로드, 회원 로그인 시 다이어리 저장 기능을 제공합니다. 비로그인 상태에서도 촬영과 다운로드는 이용할 수 있습니다.",
  },
  {
    title: "제3조 (회원가입 및 탈퇴)",
    body: "이용자는 이메일과 비밀번호로 회원가입할 수 있으며, 마이페이지에서 언제든지 자유롭게 탈퇴할 수 있습니다. 탈퇴 시 저장된 다이어리 콘텐츠는 모두 삭제됩니다.",
  },
  {
    title: "제4조 (이용자의 의무)",
    body: "이용자는 타인의 사진이나 저작물을 무단으로 촬영·업로드해서는 안 되며, 서비스를 부정한 목적으로 이용할 수 없습니다.",
  },
  {
    title: "제5조 (책임의 제한)",
    body: "서비스는 이용자가 직접 작성·저장한 콘텐츠에 대해 사전에 내용을 검토하거나 보증하지 않으며, 이용자 귀책으로 발생한 손해에 대해 책임을 지지 않습니다.",
  },
];

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />

      <section className="flex flex-1 flex-col gap-6 px-5 py-8 sm:px-8 sm:py-11 lg:px-14">
        <h1 className="text-[26px] font-extrabold">✉️ 이용약관</h1>

        <div className="airmail-frame mx-auto w-full max-w-3xl shadow-md">
          <div className="flex flex-col gap-6 bg-surface p-6 sm:p-9">
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
