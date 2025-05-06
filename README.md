# Lotto Automation

An automation project for purchasing and checking Korean Lotto 6/45 tickets.

## Project Overview

This project automates the following tasks on the [Korean Lottery (Dong Hang Bok-kwon)](https://dhlottery.co.kr) website:

- Login
- Lottery ticket purchase
- Winning number lookup
- Prize checking

## Tech Stack

- **Web Automation**: Playwright
- **Server**: AWS ECS-EC2
- **Database**: DynamoDB
- **Language**: JavaScript/TypeScript
- **Containerization**: Docker

## Key Features

1. **Automated Login**
   - Securely store account information and handle login process

2. **Automated Ticket Purchase**
   - Support for random number generation or custom number selection
   - Scheduled regular purchases

3. **Results Checking**
   - Verify winning status for purchased tickets
   - Maintain winning statistics and history

4. **Notification Service**
   - Email or other notifications upon winning

## Architecture Diagram

![Lotto Automation Architecture](/lotto-automation.drawio.svg)

The diagram above illustrates the architecture of the Lotto Automation system, showing the interaction between various components including AWS ECS, Playwright containers, and DynamoDB.

## Future Plans

- Build API endpoints
- Develop web interface
- Implement advanced number recommendation algorithms
- Mobile app development

## License

MIT

## Contributing

Pull Requests and Issues are always welcome!
