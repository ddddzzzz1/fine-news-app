import { View, Text } from "react-native";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);

const badgeVariants = cva(
    "flex-row items-center rounded-full border px-2.5 py-0.5",
    {
        variants: {
            variant: {
                default: "border-transparent bg-indigo-600",
                secondary: "border-transparent bg-indigo-50",
                destructive: "border-transparent bg-red-500",
                outline: "text-gray-900",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const badgeTextVariants = cva(
    "text-xs font-semibold",
    {
        variants: {
            variant: {
                default: "text-white",
                secondary: "text-indigo-700",
                destructive: "text-white",
                outline: "text-gray-900",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

function Badge({ className, variant, children, ...props }) {
    return (
        <StyledView className={cn(badgeVariants({ variant }), className)} {...props}>
            <StyledText className={badgeTextVariants({ variant })}>{children}</StyledText>
        </StyledView>
    );
}

export { Badge, badgeVariants };
