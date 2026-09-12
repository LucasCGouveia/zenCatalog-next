import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Serviço | ZenCatalog",
  description: "Conheça as condições de uso do ZenCatalog e de seus recursos de catalogação, integrações e inteligência artificial.",
};

// Revise este endereço antes da publicação caso o canal oficial de suporte seja outro.
const SUPPORT_EMAIL = "contato@zencatalog.gouveia.app.br";

const sectionClass = "scroll-mt-8 space-y-4";
const headingClass = "text-2xl font-black tracking-tight text-slate-950";
const paragraphClass = "text-base leading-8 text-slate-600 sm:text-lg";
const listClass = "list-disc space-y-2 pl-6 text-base leading-8 text-slate-600 sm:text-lg";

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="mb-10 text-center sm:mb-14">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-950/30"><FileCheck2 aria-hidden="true" size={28} /></div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">Termos de Serviço</h1>
        <p className="mt-4 text-base font-semibold text-blue-200">Última atualização: 12 de setembro de 2026</p>
      </header>

      <div className="space-y-10 rounded-[2.5rem] bg-white p-6 shadow-2xl shadow-black/20 sm:p-10 lg:p-12">
        <p className={paragraphClass}>Estes Termos de Serviço apresentam as condições para uso do ZenCatalog. Ao criar uma conta ou utilizar a aplicação, você declara que leu e aceita estes termos.</p>

        <section className={sectionClass}>
          <h2 className={headingClass}>1. Aceitação dos termos</h2>
          <p className={paragraphClass}>Se você não concordar com estes termos ou com a Política de Privacidade, não utilize o ZenCatalog. O uso de integrações opcionais também depende da sua autorização às permissões apresentadas pelos respectivos provedores.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>2. Sobre o ZenCatalog</h2>
          <p className={paragraphClass}>O ZenCatalog é uma aplicação de produtividade para organizar, catalogar, consultar e processar conteúdos digitais. Alguns recursos utilizam automações, pesquisa e inteligência artificial para gerar informações de apoio.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>3. Conta e acesso</h2>
          <p className={paragraphClass}>Você é responsável por fornecer informações adequadas para sua conta, preservar a confidencialidade de suas credenciais e comunicar qualquer uso não autorizado de que tenha conhecimento. O acesso pode ocorrer por credenciais próprias ou por um provedor externo disponível na aplicação.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>4. Uso permitido</h2>
          <p className={paragraphClass}>Você deve utilizar o ZenCatalog de modo lícito e apenas com conteúdos que tenha autorização para acessar e processar. Não é permitido:</p>
          <ul className={listClass}>
            <li>violar direitos de terceiros ou leis aplicáveis;</li>
            <li>tentar obter acesso não autorizado a contas, dados ou sistemas;</li>
            <li>interferir deliberadamente na segurança ou no funcionamento do serviço;</li>
            <li>usar a aplicação para distribuir conteúdo malicioso.</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>5. Integrações externas</h2>
          <p className={paragraphClass}>Algumas funcionalidades dependem de serviços e APIs de terceiros. O uso desses serviços pode estar sujeito aos termos e políticas dos respectivos provedores, e sua disponibilidade pode afetar temporariamente recursos do ZenCatalog.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>6. Google Drive e serviços Google</h2>
          <p className={paragraphClass}>Se você autorizar uma integração Google, o ZenCatalog poderá realizar, dentro das permissões concedidas, operações necessárias à funcionalidade solicitada, como obter informações, processar, organizar ou renomear arquivos autorizados. Você pode revogar esse acesso nas configurações de segurança da sua conta Google, sabendo que recursos dependentes da integração poderão deixar de funcionar.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>7. Recursos de inteligência artificial</h2>
          <p className={paragraphClass}>Recursos de inteligência artificial podem analisar conteúdo e sugerir categorias, nomes, resumos e outros metadados. Esses resultados podem conter imprecisões, omissões ou interpretações inadequadas. Você deve revisar informações importantes antes de usá-las, especialmente quando uma sugestão puder alterar a organização dos seus arquivos.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>8. Responsabilidade sobre o conteúdo</h2>
          <p className={paragraphClass}>Você permanece responsável pelos conteúdos que envia, disponibiliza ou conecta ao ZenCatalog e por assegurar que possui os direitos e autorizações necessários. O ZenCatalog não adquire propriedade sobre o seu conteúdo pelo simples uso do serviço.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>9. Disponibilidade do serviço</h2>
          <p className={paragraphClass}>Buscamos manter o ZenCatalog disponível e funcional, mas interrupções podem ocorrer por manutenção, falhas, atualizações ou indisponibilidade de provedores externos. Não prometemos disponibilidade contínua ou livre de erros.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>10. Limitações razoáveis</h2>
          <p className={paragraphClass}>O ZenCatalog é oferecido como ferramenta de apoio à produtividade e catalogação. Na medida permitida pela legislação aplicável, não garantimos que resultados automatizados atenderão a todos os objetivos do usuário. Nada nestes termos exclui direitos ou responsabilidades que não possam ser limitados por lei.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>11. Privacidade</h2>
          <p className={paragraphClass}>O tratamento de informações pessoais e dados de integrações é explicado na <Link className="font-bold text-blue-700 underline decoration-blue-300 underline-offset-4 outline-none hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500" href="/privacy">Política de Privacidade</Link>, que integra estes termos.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>12. Alterações</h2>
          <p className={paragraphClass}>Estes termos podem ser atualizados para acompanhar mudanças na aplicação ou em seus processos. A data no início do documento indica a versão mais recente. Quando apropriado, mudanças relevantes serão comunicadas pelos meios disponíveis no serviço.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>13. Encerramento do uso</h2>
          <p className={paragraphClass}>Você pode deixar de utilizar o ZenCatalog a qualquer momento. O acesso também poderá ser suspenso ou encerrado em caso de violação destes termos, risco à segurança ou descontinuação do serviço, de forma compatível com a situação e com a legislação aplicável.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>14. Contato</h2>
          <p className={paragraphClass}>Para dúvidas sobre estes termos, escreva para <a className="font-bold text-blue-700 underline decoration-blue-300 underline-offset-4 outline-none hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
        </section>
      </div>
    </article>
  );
}
