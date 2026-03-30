interface GoalifyLogoProps {
  size?: number;
}

const GoalifyLogo: React.FC<GoalifyLogoProps> = ({ size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_52_179)">
        <path
          d="M452.971 199C428.277 113.514 349.439 51 256 51C142.782 51 51 142.782 51 256C51 369.218 142.782 461 256 461C349.439 461 428.277 398.486 452.971 313"
          stroke="white"
          strokeWidth="30"
          strokeLinecap="round"
        />
        <circle cx="467.5" cy="255.5" r="22.5" fill="white" />
        <path
          d="M216 256L403.5 256"
          stroke="white"
          strokeWidth="45"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_52_179">
          <rect width="512" height="512" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default GoalifyLogo;
