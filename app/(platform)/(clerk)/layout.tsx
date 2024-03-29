import Background from "@/components/background";

const ClerkLayout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <>
      <Background />
      <div className="h-full flex items-center justify-center">
        {children}
      </div>
    </>
  );
};

export default ClerkLayout;
