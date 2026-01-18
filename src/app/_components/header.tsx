import Link from "next/link";

type Props = {
  title: string;
};

const Header = ({ title }: Props) => {
  return (
    <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight mb-20 mt-8 flex items-center">
      <Link href="/" className="hover:underline">
        {title}
      </Link>
    </h2>
  );
};

export default Header;
