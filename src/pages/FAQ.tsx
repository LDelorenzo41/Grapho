import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'À partir de quel âge peut-on consulter un graphothérapeute ?',
    answer: 'La graphothérapie peut être proposée dès 6-7 ans, lorsque l\'enfant a commencé l\'apprentissage de l\'écriture. Il n\'y a pas d\'âge maximum : adolescents et adultes peuvent également bénéficier d\'une remédiation de l\'écriture.',
  },
  
  {
    question: 'La graphothérapie est-elle remboursée ?',
    answer: 'La graphothérapie n\'est pas remboursée par la Sécurité sociale. Cependant, certaines mutuelles prennent en charge tout ou partie des séances au titre des médecines douces. Je vous invite à vous renseigner auprès de votre mutuelle.',
  },
  {
    question: 'La graphothérapie remplace-t-elle un suivi orthophonique ou psychomoteur ?',
    answer: 'Non, absolument pas ! Elle peut être complémentaire d’autres suivis, selon les besoins, mais ne se substitue pas à un suivi chez une orthophoniste ou une psychomotricienne. ',
  },
  {
    question: 'Quelle est la différence entre un graphothérapeute et un ergothérapeute ?',
    answer: 'Le graphothérapeute est spécialisé uniquement dans la remédiation de l\'écriture manuscrite. L\'ergothérapeute a un champ d\'action plus large et intervient sur l\'ensemble des gestes du quotidien. Les deux professionnels peuvent travailler en complémentarité.',
  },
  {
    question: 'Faut-il une prescription médicale ?',
    answer: 'Non, aucune prescription médicale n\'est nécessaire pour consulter un graphothérapeute. Cependant, il peut être utile d\'en informer le médecin traitant ou le pédiatre.',
  },

{
    question: 'Faut-il être « mauvais en écriture » pour consulter ?',
    answer: 'Non. Par exemple, certaines personnes ayant une écriture visuellement harmonieuse ont recours à la graphothérapie seulement pour augmenter leur rythme d\'écriture, souvent lent. Toutes les problématiques sont bonnes à étudier !',
  },
  
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div>
      {/* Section titre - FOND BLANC */}
      <section className="bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-title text-4xl md:text-5xl font-bold text-text mb-4 text-center">
            Questions fréquentes
          </h1>
          <p className="font-body text-lg text-gray-600 text-center">
            Retrouvez les réponses aux questions les plus courantes
          </p>
        </div>
      </section>

      {/* Section questions - FOND COLORÉ */}
      <section className="bg-[#E5B7A4]/20 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <span className="font-title text-lg font-semibold text-text pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="font-body text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}