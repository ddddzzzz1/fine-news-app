import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebaseConfig';
import { Button } from '../../../components/ui/button';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledSafeAreaView = styled(SafeAreaView);

export default function EditNewsDraft() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content_text: '',
    });

    useEffect(() => {
        loadDraft();
    }, [id]);

    const loadDraft = async () => {
        if (!id) return;
        try {
            const docRef = doc(db, 'news_drafts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData({
                    title: data.title || '',
                    summary: data.summary || '',
                    content_text: data.content_text || '',
                });
            } else {
                Alert.alert('Error', 'Draft not found');
                router.back();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load draft');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content_text) {
            Alert.alert('Validation', 'Title and Content are required');
            return;
        }

        setSaving(true);
        try {
            // Simple HTML conversion: wrap paragraphs in <p>
            const contentHtml = formData.content_text
                .split('\n\n')
                .map(p => `<p>${p}</p>`)
                .join('');

            const updates = {
                title: formData.title,
                summary: formData.summary,
                content_text: formData.content_text,
                content_html: contentHtml,
                updated_at: serverTimestamp(),
                updated_by: auth.currentUser?.email || 'admin',
            };

            await updateDoc(doc(db, 'news_drafts', id), updates);
            Alert.alert('Success', 'Draft updated successfully');
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <StyledSafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#4f46e5" />
            </StyledSafeAreaView>
        );
    }

    return (
        <StyledSafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" onPress={() => router.back()}>
                    <StyledText className="text-gray-600">Cancel</StyledText>
                </Button>
                <StyledText className="font-bold text-lg">Edit Draft</StyledText>
                <Button variant="ghost" onPress={handleSave} disabled={saving}>
                    <StyledText className="text-indigo-600 font-bold">
                        {saving ? 'Saving...' : 'Save'}
                    </StyledText>
                </Button>
            </StyledView>

            <ScrollView className="flex-1 p-4">
                <StyledView className="mb-4">
                    <StyledText className="text-sm font-medium text-gray-700 mb-1">Title</StyledText>
                    <StyledTextInput
                        className="border border-gray-200 rounded-lg p-3 text-base"
                        value={formData.title}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                        placeholder="Enter title"
                    />
                </StyledView>

                <StyledView className="mb-4">
                    <StyledText className="text-sm font-medium text-gray-700 mb-1">Summary</StyledText>
                    <StyledTextInput
                        className="border border-gray-200 rounded-lg p-3 text-base"
                        value={formData.summary}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, summary: text }))}
                        placeholder="Enter summary"
                        multiline
                    />
                </StyledView>

                <StyledView className="mb-8">
                    <StyledText className="text-sm font-medium text-gray-700 mb-1">Content (Text)</StyledText>
                    <StyledTextInput
                        className="border border-gray-200 rounded-lg p-3 text-base min-h-[200px]"
                        value={formData.content_text}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, content_text: text }))}
                        placeholder="Enter content (paragraphs separated by empty lines)"
                        multiline
                        textAlignVertical="top"
                    />
                    <StyledText className="text-xs text-gray-500 mt-1">
                        * Text will be automatically wrapped in HTML paragraphs on save.
                    </StyledText>
                </StyledView>
            </ScrollView>
        </StyledSafeAreaView>
    );
}
