package com.hust.se.bluemoon;

import javafx.application.Application;
import javafx.stage.Stage;

public class BlueMoonApplication extends Application {
    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("Hệ thống Quản lý Thu phí Chung cư BlueMoon v1.0");
        primaryStage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
