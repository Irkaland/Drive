import { ACTIVE_CHAPTER } from '../../content/registry';
import { LAW_TITLE_KA, LAW_URL, REVIEW_STATUS_LABEL_KA, RULES, SOURCE_REGISTER } from '../../content/rules';

export function SourcesScreen() {
  const c = ACTIVE_CHAPTER;
  return (
    <section className="page narrow">
      <header className="page-head">
        <h1>წყაროები და განხილვის რეესტრი</h1>
        <p className="lead">
          ძირითადი წყარო: {LAW_TITLE_KA}, მუხლი 36 —{' '}
          <a href={LAW_URL} target="_blank" rel="noopener noreferrer">
            matsne.gov.ge
          </a>
          .
        </p>
      </header>

      <div className="notice" role="note">
        <p>
          განხილვის სტატუსები: <strong>სამუშაო ვერსია</strong> → <strong>შემოწმებულია წყაროსთან</strong> →{' '}
          <strong>განხილულია ინსტრუქტორის მიერ</strong>. ბოლო სტატუსის მინიჭება მხოლოდ კვალიფიციური ადამიანის რეალური განხილვის შემდეგ შეიძლება.
          ამ ეტაპზე არცერთ მასალას ეს სტატუსი არ აქვს.
        </p>
      </div>

      {SOURCE_REGISTER.map((e) => (
        <article key={e.ruleId} className="card register-entry">
          <h2>{RULES[e.ruleId].titleKa}</h2>
          <dl>
            <dt>წესის ID</dt>
            <dd>
              <code>{e.ruleId}</code>
            </dd>
            <dt>მუხლი და პუნქტი</dt>
            <dd>
              მუხლი {e.article}, პუნქტი {e.paragraph}
            </dd>
            <dt>წყარო</dt>
            <dd>
              <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">
                {e.sourceUrl}
              </a>
              <br />
              <span className="meta">{e.consolidatedVersion}</span>
            </dd>
            <dt>შემოწმების თარიღი</dt>
            <dd>{e.dateChecked}</dd>
            <dt>პერიფრაზი</dt>
            <dd>{e.paraphraseKa}</dd>
            <dt>ოფიციალური ტექსტი</dt>
            <dd>
              <blockquote>{RULES[e.ruleId].officialTextKa}</blockquote>
            </dd>
            <dt>სტატუსი</dt>
            <dd>{REVIEW_STATUS_LABEL_KA[e.reviewStatus]}</dd>
            <dt>შენიშვნა</dt>
            <dd lang="en">{e.notes}</dd>
          </dl>
        </article>
      ))}

      <article className="card">
        <h2>ამოცანების სტატუსი</h2>
        <div className="table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th scope="col">ამოცანა</th>
                <th scope="col">წესი</th>
                <th scope="col">ვერსია</th>
                <th scope="col">სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              {c.scenarios.map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    {s.titleKa}
                    <span className="item-sub">
                      <code>{s.id}</code>
                    </span>
                  </th>
                  <td data-label="წესი">{RULES[s.ruleId].articleKa}</td>
                  <td data-label="ვერსია">{s.version}</td>
                  <td data-label="სტატუსი">{REVIEW_STATUS_LABEL_KA[s.reviewStatus]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card">
        <h2>შეზღუდვები</h2>
        <ul>
          <li>ყველა სიტუაცია ორიგინალურია; ეს არ არის ოფიციალური საგამოცდო ბილეთები.</li>
          <li>პროდუქტი არ არის დამტკიცებული მომსახურების სააგენტოს მიერ და შინაარსი ჯერ არ განუხილავს ინსტრუქტორს.</li>
          <li>
            ნიშნები 2.1 „მთავარი გზა“, 2.3 „დაუთმე გზა“ და დაფა 8.13 „მთავარი გზის მიმართულება“ შედარებულია კანონის დანართთან
            (საგზაო ნიშნების კატალოგთან) და მის მიხედვით არის დახატული. დანართში ზომები მითითებული არ არის, ამიტომ პროპორციები
            დანართის სურათებიდან არის აღებული და მიახლოებითია.
          </li>
          <li>თავის გავლა არ ადასტურებს ეროვნული გამოცდისთვის მზადყოფნას.</li>
        </ul>
      </article>
    </section>
  );
}
