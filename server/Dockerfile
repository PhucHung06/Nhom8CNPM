FROM maven:3.9.9-eclipse-temurin-21

WORKDIR /app

# Tải trước dependencies để cache layer, giúp các lần build sau nhanh hơn
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src

EXPOSE 8080

CMD ["mvn", "spring-boot:run"]
