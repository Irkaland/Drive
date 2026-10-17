import { hrefFor } from '../../hooks/useRoute';
import { useProgress } from '../../progress/ProgressContext';

export function StorageNotice() {
  const { persistent } = useProgress();
  return (
    <p className="notice notice-quiet" role="note">
      {persistent
        ? 'პროგრესი ინახება მხოლოდ ამ ბრაუზერში. ის სხვა მოწყობილობებთან არ სინქრონიზდება და არსად იგზავნება. ანგარიში საჭირო არ არის.'
        : 'ეს ბრაუზერი არ იძლევა მონაცემების შენახვის საშუალებას, ამიტომ პროგრესი მხოლოდ ამ გვერდის გახსნილობისას შენარჩუნდება.'}
    </p>
  );
}

export function ContentNotice() {
  return (
    <div className="notice" role="note">
      <p>
        <strong>შინაარსის სტატუსი.</strong> სასწავლო სიტუაციები ორიგინალურია და შედარებულია კანონის „საგზაო მოძრაობის შესახებ“ მოქმედ
        კონსოლიდირებულ ტექსტთან (მუხლი 36). მასალა ჯერ არ განუხილავს კვალიფიციურ ინსტრუქტორს — საჯარო სასწავლო გამოყენებამდე საჭიროა
        დამატებითი გადამოწმება.
      </p>
      <p>
        ეს არ არის ოფიციალური საგამოცდო ბილეთები, პროდუქტი არ არის დამტკიცებული მომსახურების სააგენტოს მიერ და თავის გავლა არ ადასტურებს
        გამოცდისთვის მზადყოფნას. <a href={hrefFor({ name: 'sources' })}>წყაროები და განხილვის რეესტრი</a>
      </p>
    </div>
  );
}

export function RecoveredNotice() {
  const { recovered, dismissRecovered } = useProgress();
  if (!recovered) return null;
  return (
    <div className="notice notice-warn" role="status">
      <p>შენახული პროგრესის ნაწილი დაზიანებული იყო და ვერ წავიკითხეთ. აპლიკაცია ახალი, სუფთა მდგომარეობიდან გაგრძელდა.</p>
      <button type="button" className="btn btn-secondary" onClick={dismissRecovered}>
        გასაგებია
      </button>
    </div>
  );
}
