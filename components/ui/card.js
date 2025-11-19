import { View, Text } from "react-native";
import { cn } from "../../lib/utils";
import { styled } from "nativewind";

const StyledView = styled(View);
const StyledText = styled(Text);

const Card = ({ className, ...props }) => (
    <StyledView
        className={cn("rounded-lg border border-gray-200 bg-white shadow-sm", className)}
        {...props}
    />
);

const CardHeader = ({ className, ...props }) => (
    <StyledView className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
    <StyledText
        className={cn("text-2xl font-semibold leading-none tracking-tight text-gray-900", className)}
        {...props}
    />
);

const CardDescription = ({ className, ...props }) => (
    <StyledText className={cn("text-sm text-gray-500", className)} {...props} />
);

const CardContent = ({ className, ...props }) => (
    <StyledView className={cn("p-6 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }) => (
    <StyledView className={cn("flex flex-row items-center p-6 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
