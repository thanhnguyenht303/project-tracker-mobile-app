import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProjectListScreen } from "../screens/ProjectListScreen";
import { ProjectDetailScreen } from "../screens/ProjectDetailScreen";

export type RootStackParamList = {
    Projects: undefined;
    ProjectDetail: { projectId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Projects" component={ProjectListScreen} options={{ title: "Projects" }} />
            <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: "Project" }} />
        </Stack.Navigator>
    );
}
