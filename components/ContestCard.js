import React from 'react';
import { Link } from 'expo-router';
import { View, Text, Image, Pressable } from 'react-native';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Eye } from 'lucide-react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export default function ContestCard({ contest }) {
    return (
        <Link href={`/contest/${contest.id}`} asChild>
            <Pressable>
                <Card className="overflow-hidden border-0 shadow-sm mb-3">
                    <StyledView className="aspect-[4/5] w-full bg-orange-50 overflow-hidden">
                        {contest.image_url ? (
                            <StyledImage
                                source={{ uri: contest.image_url }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <StyledView className="w-full h-full items-center justify-center">
                                <StyledView className="p-4">
                                    <StyledText className="font-bold text-lg text-gray-700 text-center">
                                        {contest.title}
                                    </StyledText>
                                </StyledView>
                            </StyledView>
                        )}
                    </StyledView>
                    <StyledView className="p-3">
                        <StyledText className="font-bold text-sm text-gray-900 mb-1" numberOfLines={2}>
                            {contest.title}
                        </StyledText>
                        <StyledText className="text-xs text-gray-600 mb-2">{contest.organizer}</StyledText>
                        <StyledView className="flex-row items-center justify-between">
                            <Badge variant="secondary" className="bg-indigo-50">
                                <StyledText className="text-xs text-indigo-700">
                                    D-{Math.ceil((new Date(contest.end_date) - new Date()) / (1000 * 60 * 60 * 24))}
                                </StyledText>
                            </Badge>
                            <StyledView className="flex-row items-center space-x-1">
                                <Eye size={12} color="#6b7280" />
                                <StyledText className="text-xs text-gray-500">{contest.views || 0}</StyledText>
                            </StyledView>
                        </StyledView>
                    </StyledView>
                </Card>
            </Pressable>
        </Link>
    );
}
